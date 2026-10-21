-- Lúmen · a resposta registra se a busca de diretrizes brasileiras rodou.
-- true: rodou (o front avisa quando nenhuma diretriz entrou nos artigos).
-- null: resposta antiga, que reaproveitou artigos, ou busca de diretrizes que falhou.
alter table public.search_turns add column if not exists guidelines_searched boolean;
