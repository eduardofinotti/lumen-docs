-- Lúmen · código de convite reutilizável (um só código para a turma de teste).
-- `reusable = true`: o código vale para quantos cadastros houver e só conta os usos.
-- Os códigos antigos continuam de uso único.
--
--   insert into public.invites (code, invited_by, reusable) values ('LUMEN-BETA26', 'admin', true);
--   update public.invites set reusable = false, used_at = now() where code = 'LUMEN-BETA26';  -- encerra o código
--   (quem já se cadastrou continua com a conta)
alter table public.invites
  add column if not exists reusable boolean not null default false,
  add column if not exists uses integer not null default 0;

create or replace function public.is_invite_valid(p_email text, p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.invites where email is not null and lower(email) = lower(trim(p_email)))
      or exists (
        select 1 from public.invites
        where code is not null and nullif(trim(p_code), '') is not null
          and upper(code) = upper(trim(p_code))
          and (reusable or used_at is null)
      );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code text := nullif(trim(new.raw_user_meta_data->>'invite_code'), '');
  v_invite uuid;
begin
  update public.invites set used_at = coalesce(used_at, now()), used_by = coalesce(used_by, new.id), uses = uses + 1
  where email is not null and lower(email) = lower(new.email)
  returning id into v_invite;

  -- Reutilizável: só soma o uso. Uso único: consome o código (de forma atômica).
  if v_invite is null and v_code is not null then
    update public.invites set uses = uses + 1
    where code is not null and upper(code) = upper(v_code) and reusable
    returning id into v_invite;
  end if;

  if v_invite is null and v_code is not null then
    update public.invites set used_at = now(), used_by = new.id, uses = uses + 1
    where code is not null and upper(code) = upper(v_code) and not reusable and used_at is null
    returning id into v_invite;
  end if;

  if v_invite is null then
    raise exception 'Cadastro restrito: e-mail sem convite.';
  end if;

  insert into public.profiles (id, full_name, specialty, crm, crm_uf)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'specialty',
    new.raw_user_meta_data->>'crm',
    new.raw_user_meta_data->>'crm_uf'
  );
  return new;
end $$;
