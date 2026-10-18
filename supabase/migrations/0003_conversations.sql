-- Lúmen · conversa contínua, artigos salvos e créditos
-- `searches` passa a ser a conversa; cada pergunta é um turno em `search_turns`.
-- As colunas antigas de `searches` (status, answer_md, pubmed_query, error) continuam
-- até a 0004, para a versão anterior da função não quebrar durante a troca.

-- Turnos da conversa ----------------------------------------------------------
create table if not exists public.search_turns (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.searches(id) on delete cascade,
  position int not null,                            -- 1, 2, 3… na ordem da conversa
  question text not null,                           -- como o médico escreveu
  standalone_question text,                         -- como o Lúmen entendeu (continuações)
  action text check (action in ('search', 'reuse')),
  status public.search_status not null default 'pending',
  answer_md text,
  pubmed_query text,
  error text,
  created_at timestamptz not null default now(),
  unique (search_id, position)
);

alter table public.searches add column if not exists updated_at timestamptz not null default now();
create index if not exists searches_user_updated on public.searches (user_id, updated_at desc);

-- Fontes passam a pertencer a um turno; cada turno numera as suas a partir de 1.
alter table public.sources
  add column if not exists turn_id uuid references public.search_turns(id) on delete cascade,
  add column if not exists pmcid text,
  add column if not exists doi text;
alter table public.sources drop constraint if exists sources_search_id_position_key;
create unique index if not exists sources_turn_position on public.sources (turn_id, position);

-- Backfill: cada pesquisa existente vira o turno 1 com a resposta e as fontes que já tinha.
insert into public.search_turns (search_id, position, question, action, status, answer_md, pubmed_query, error, created_at)
select s.id, 1, s.question, 'search', s.status, s.answer_md, s.pubmed_query, s.error, s.created_at
from public.searches s
where not exists (select 1 from public.search_turns t where t.search_id = s.id);

update public.sources src set turn_id = t.id
from public.search_turns t
where src.turn_id is null and t.search_id = src.search_id and t.position = 1;

update public.searches set updated_at = created_at;

-- Artigos salvos (lista única por médico) ------------------------------------
-- Guarda uma cópia dos dados para exibir e citar mesmo se a conversa for apagada.
create table if not exists public.saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pmid text not null,
  title text not null,
  authors text,
  journal text,
  year int,
  volume text,
  issue text,
  pages text,
  evidence_label text,
  summary_pt text,
  pmcid text,
  doi text,
  search_id uuid references public.searches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, pmid)
);
create index if not exists saved_articles_user_created on public.saved_articles (user_id, created_at desc);

-- Créditos --------------------------------------------------------------------
-- Sem preço por enquanto: todos com 999.
alter table public.profiles alter column credits set default 999;
update public.profiles set credits = 999;

-- Devolve o crédito de uma pergunta que falhou (chamada pela Edge Function).
create or replace function public.refund_credit(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles set credits = credits + 1 where id = p_user;
$$;

-- RLS ---------------------------------------------------------------------------
alter table public.search_turns enable row level security;
alter table public.saved_articles enable row level security;

-- Turnos: o dono da conversa lê; só a função (service role) escreve.
create policy "turnos: dono lê" on public.search_turns for select
  using (exists (select 1 from public.searches s where s.id = search_id and s.user_id = auth.uid()));
revoke insert, update, delete on public.search_turns from anon, authenticated;

-- Salvos: cada médico lê, salva e remove os próprios.
create policy "salvos: dono lê"    on public.saved_articles for select using (auth.uid() = user_id);
create policy "salvos: dono salva" on public.saved_articles for insert with check (auth.uid() = user_id);
create policy "salvos: dono remove" on public.saved_articles for delete using (auth.uid() = user_id);
revoke update on public.saved_articles from anon, authenticated;
revoke all on public.saved_articles from anon;
grant select, insert, delete on public.saved_articles to authenticated;

revoke execute on function public.refund_credit(uuid) from public, anon, authenticated;
