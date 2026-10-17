-- Lúmen · dados de citação dos artigos (formato Vancouver no "Copiar com referências")
alter table public.sources
  add column if not exists volume text,
  add column if not exists issue text,
  add column if not exists pages text;

comment on column public.sources.authors is 'Até 7 autores no formato Vancouver ("Knowler WC"), separados por "; ". Mais de 6 indica que há outros.';
