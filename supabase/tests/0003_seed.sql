-- Dados criados ANTES da 0003: dois médicos e uma pesquisa concluída com duas fontes.
insert into public.invites (email, invited_by) values ('a@lumen.test', 'teste'), ('b@lumen.test', 'teste');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@lumen.test', '{"full_name":"Médico A"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@lumen.test', '{"full_name":"Médico B"}');
insert into public.searches (id, user_id, question, date_range, status, answer_md, pubmed_query)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a',
        'Metformina reduz risco cardiovascular?', '5y', 'done', 'Resposta antiga [1] [2].', 'metformin');
insert into public.sources (search_id, position, pmid, title) values
  ('11111111-1111-1111-1111-111111111111', 1, '11832527', 'Artigo 1'),
  ('11111111-1111-1111-1111-111111111111', 2, '26377054', 'Artigo 2');
