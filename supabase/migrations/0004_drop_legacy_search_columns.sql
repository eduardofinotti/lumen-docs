-- Lúmen · remove de `searches` o que passou para `search_turns` na 0003.
-- Aplicar só depois que a função `search` nova (que grava nos turnos) estiver publicada.
alter table public.searches
  drop column if exists status,
  drop column if exists answer_md,
  drop column if exists pubmed_query,
  drop column if exists error;

-- Toda fonte pertence a um turno (a função antiga, que gravava sem turno, já saiu).
alter table public.sources alter column turn_id set not null;
