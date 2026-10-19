-- Lúmen · superadmin: painel em /admin com dados de uso, usuários e códigos de acesso.
-- Toda leitura e escrita do painel passa por funções `admin_*`, que conferem `is_admin`
-- no banco; o front não recebe a chave de serviço. O painel não lê o texto das perguntas
-- (podem conter dado de paciente), só números.

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists blocked_at timestamptz;
-- `is_admin` e `blocked_at` ficam fora do `grant update` da 0001: o médico não muda os seus.

update public.profiles set is_admin = true
where id in (select id from auth.users where lower(email) = 'eduardo.finotti.ef@gmail.com');

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin and blocked_at is null from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.assert_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito.' using errcode = '42501';
  end if;
end $$;

-- Bloqueado não gasta crédito (a função `search` responde 402 e não pesquisa).
create or replace function public.debit_credit(p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.profiles set credits = credits - 1
  where id = p_user and credits > 0 and blocked_at is null
  returning true into ok;
  return coalesce(ok, false);
end $$;

-- Dados da ferramenta ---------------------------------------------------------
create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v jsonb;
begin
  perform public.assert_admin();

  select jsonb_build_object(
    'usersTotal',      (select count(*) from profiles),
    'usersNew7d',      (select count(*) from profiles where created_at >= now() - interval '7 days'),
    'usersNew30d',     (select count(*) from profiles where created_at >= now() - interval '30 days'),
    'usersActive7d',   (select count(distinct s.user_id) from search_turns t join searches s on s.id = t.search_id
                        where t.created_at >= now() - interval '7 days'),
    'usersBlocked',    (select count(*) from profiles where blocked_at is not null),
    'conversations',   (select count(*) from searches),
    'questions',       (select count(*) from search_turns),
    'questions7d',     (select count(*) from search_turns where created_at >= now() - interval '7 days'),
    'statusDone',      (select count(*) from search_turns where status = 'done'),
    'statusNoEvidence',(select count(*) from search_turns where status = 'no_evidence'),
    'statusError',     (select count(*) from search_turns where status = 'error'),
    'savedArticles',   (select count(*) from saved_articles),
    'specialties', coalesce((
      select jsonb_agg(jsonb_build_object('specialty', specialty, 'total', total) order by total desc, specialty)
      from (select coalesce(specialty, '') as specialty, count(*) as total from profiles
            group by 1 order by 2 desc, 1 limit 6) x), '[]'::jsonb),
    'daily', (
      select jsonb_agg(jsonb_build_object('day', d::date, 'total', coalesce(c.total, 0)) order by d)
      from generate_series(v_today - 29, v_today, interval '1 day') d
      left join (select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as total
                 from search_turns where created_at >= now() - interval '31 days' group by 1) c
        on c.day = d::date)
  ) into v;
  return v;
end $$;

-- Usuários --------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, full_name text, specialty text, crm text, crm_uf text,
  credits int, is_admin boolean, blocked_at timestamptz, created_at timestamptz,
  last_active_at timestamptz, questions bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
    select p.id, u.email::text, p.full_name::text, p.specialty::text, p.crm::text, p.crm_uf::text,
           p.credits::int, p.is_admin, p.blocked_at, p.created_at,
           a.last_active_at, coalesce(a.questions, 0)
    from profiles p
    join auth.users u on u.id = p.id
    left join (
      select s.user_id, max(t.created_at) as last_active_at, count(t.id) as questions
      from searches s join search_turns t on t.search_id = s.id
      group by s.user_id
    ) a on a.user_id = p.id
    order by p.created_at desc;
end $$;

create or replace function public.admin_set_credits(p_user uuid, p_credits int)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  if p_credits is null or p_credits < 0 or p_credits > 100000 then
    raise exception 'Créditos inválidos.' using errcode = '22023';
  end if;
  update profiles set credits = p_credits where id = p_user;
end $$;

create or replace function public.admin_set_blocked(p_user uuid, p_blocked boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  if p_user = auth.uid() then
    raise exception 'Você não pode bloquear a própria conta.' using errcode = '22023';
  end if;
  update profiles set blocked_at = case when p_blocked then coalesce(blocked_at, now()) end
  where id = p_user;
end $$;

-- Códigos de acesso -----------------------------------------------------------
create or replace function public.admin_list_invites()
returns table (
  id uuid, email text, code text, reusable boolean, uses int,
  used_at timestamptz, used_by_email text, invited_by text, created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
    select i.id, i.email::text, i.code::text, i.reusable, i.uses, i.used_at, u.email::text, i.invited_by::text, i.created_at
    from invites i left join auth.users u on u.id = i.used_by
    order by i.created_at desc;
end $$;

-- Código (aleatório ou escolhido) ou e-mail. Devolve o id do convite.
create or replace function public.admin_create_invite(p_email text, p_code text, p_reusable boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_email text := nullif(lower(trim(p_email)), '');
  v_code text := nullif(upper(trim(p_code)), '');
  v_by text;
  v_id uuid;
begin
  perform public.assert_admin();
  if (v_email is null) = (v_code is null) then
    raise exception 'Informe um e-mail ou um código.' using errcode = '22023';
  end if;
  select full_name into v_by from profiles where id = auth.uid();
  insert into invites (email, code, reusable, invited_by)
  values (v_email, v_code, coalesce(p_reusable, false) and v_code is not null, coalesce(nullif(v_by, ''), 'admin'))
  returning invites.id into v_id;
  return v_id;
end $$;

-- Encerra: o código para de valer (quem já entrou continua com a conta).
create or replace function public.admin_close_invite(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  update invites set reusable = false, used_at = coalesce(used_at, now()) where id = p_id;
end $$;

-- Convite por e-mail que ainda não foi usado: dá para retirar.
create or replace function public.admin_delete_invite(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  delete from invites where id = p_id and used_at is null and uses = 0;
end $$;

-- Permissões: só quem está logado chama; a checagem de admin é feita dentro de cada função.
do $$
declare f text;
begin
  foreach f in array array[
    'public.assert_admin()', 'public.admin_overview()', 'public.admin_list_users()',
    'public.admin_set_credits(uuid, int)', 'public.admin_set_blocked(uuid, boolean)',
    'public.admin_list_invites()', 'public.admin_create_invite(text, text, boolean)',
    'public.admin_close_invite(uuid)', 'public.admin_delete_invite(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.debit_credit(uuid) from public, anon, authenticated;
