-- Lúmen · conclusão no topo da resposta, artigo retratado e "Essa resposta ajudou?"

-- Conclusão e força da evidência de cada resposta (gravadas pela Edge Function).
-- Respostas antigas ficam com null e aparecem sem o bloco.
alter table public.search_turns
  add column if not exists conclusion text,
  add column if not exists evidence_strength text
    check (evidence_strength in ('alta', 'moderada', 'baixa', 'insuficiente')),
  add column if not exists evidence_reason text;

-- Artigo retratado no PubMed (lido na hora da busca). Salvos copiam o valor.
alter table public.sources add column if not exists retracted boolean not null default false;
alter table public.saved_articles add column if not exists retracted boolean not null default false;

-- Votos ----------------------------------------------------------------------
-- Um voto por resposta; o médico pode mudar. Motivo só no "não", e opcional.
create table if not exists public.turn_feedback (
  turn_id uuid not null references public.search_turns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  helpful boolean not null,
  reason text check (reason in ('fora-do-tema', 'confusa', 'faltou-evidencia', 'outro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (turn_id, user_id),
  check (helpful is false or reason is null)
);

alter table public.turn_feedback enable row level security;

-- Só vota quem é dono da conversa, e só em resposta concluída.
create or replace function public.owns_done_turn(p_turn uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from search_turns t join searches s on s.id = t.search_id
    where t.id = p_turn and t.status = 'done' and s.user_id = auth.uid()
  );
$$;
revoke execute on function public.owns_done_turn(uuid) from public, anon;
grant execute on function public.owns_done_turn(uuid) to authenticated;

create policy "votos: dono lê" on public.turn_feedback for select using (auth.uid() = user_id);
create policy "votos: dono vota" on public.turn_feedback for insert
  with check (auth.uid() = user_id and public.owns_done_turn(turn_id));
create policy "votos: dono muda" on public.turn_feedback for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id and public.owns_done_turn(turn_id));
revoke all on public.turn_feedback from anon;
revoke delete on public.turn_feedback from authenticated;
grant select, insert, update on public.turn_feedback to authenticated;

-- Painel admin: acrescenta os votos (só números) -------------------------------
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
    'feedbackHelpful',    (select count(*) from turn_feedback where helpful),
    'feedbackNotHelpful', (select count(*) from turn_feedback where not helpful),
    'feedbackReasons', coalesce((
      select jsonb_agg(jsonb_build_object('reason', reason, 'total', total) order by total desc, reason)
      from (select coalesce(reason, '') as reason, count(*) as total from turn_feedback
            where not helpful group by 1) x), '[]'::jsonb),
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
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
