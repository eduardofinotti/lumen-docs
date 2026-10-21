-- Lúmen · "Ver relatos de caso" de uma resposta.
-- case_reports_at: quando o médico pediu (trava contra pedido duplo; volta a null se a busca falhar).
alter table public.search_turns add column if not exists case_reports_at timestamptz;

-- Relatos de caso encontrados para a resposta, com o resumo em português. Só a função escreve.
create table if not exists public.case_reports (
  turn_id uuid not null references public.search_turns(id) on delete cascade,
  search_id uuid not null references public.searches(id) on delete cascade,
  position int not null,
  pmid text not null,
  title text not null,
  authors text,
  journal text,
  year int,
  volume text,
  issue text,
  pages text,
  pmcid text,
  doi text,
  abstract text,
  summary_pt text,
  retracted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (turn_id, position)
);

alter table public.case_reports enable row level security;

create policy "relatos de caso: dono lê" on public.case_reports for select
  using (exists (select 1 from public.searches s where s.id = search_id and s.user_id = auth.uid()));
revoke insert, update, delete on public.case_reports from anon, authenticated;
