-- Asserções da migration 0003. Falha no primeiro problema (raise exception).
do $$
declare
  v_turn uuid;
  n int;
begin
  -- Backfill: a pesquisa antiga virou o turno 1, com a resposta e as duas fontes
  select id into v_turn from public.search_turns
  where search_id = '11111111-1111-1111-1111-111111111111' and position = 1;
  if v_turn is null then raise exception 'backfill: turno 1 ausente'; end if;
  select count(*) into n from public.search_turns where search_id = '11111111-1111-1111-1111-111111111111';
  if n <> 1 then raise exception 'backfill: esperado 1 turno, veio %', n; end if;
  if (select answer_md from public.search_turns where id = v_turn) <> 'Resposta antiga [1] [2].' then
    raise exception 'backfill: answer_md diferente';
  end if;
  if (select status from public.search_turns where id = v_turn) <> 'done' then raise exception 'backfill: status'; end if;
  select count(*) into n from public.sources where turn_id = v_turn;
  if n <> 2 then raise exception 'backfill: esperado 2 fontes no turno, veio %', n; end if;

  -- Créditos
  select count(*) into n from public.profiles where credits <> 999;
  if n <> 0 then raise exception 'créditos: % perfis sem 999', n; end if;
  if (select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'credits') <> '999' then
    raise exception 'créditos: default não é 999';
  end if;

  -- refund_credit só para service role
  if has_function_privilege('authenticated', 'public.refund_credit(uuid)', 'execute') then
    raise exception 'refund_credit executável por authenticated';
  end if;
end $$;

-- RLS como médico A
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
do $$
declare n int;
begin
  select count(*) into n from public.search_turns;
  if n <> 1 then raise exception 'rls: A deveria ver 1 turno, viu %', n; end if;
  begin
    insert into public.search_turns (search_id, position, question)
    values ('11111111-1111-1111-1111-111111111111', 2, 'e agora?');
    raise exception 'rls: A conseguiu inserir turno';
  exception when insufficient_privilege then null;
  end;
  insert into public.saved_articles (user_id, pmid, title)
  values ('00000000-0000-0000-0000-00000000000a', '11832527', 'Artigo 1');
  begin
    insert into public.saved_articles (user_id, pmid, title)
    values ('00000000-0000-0000-0000-00000000000a', '11832527', 'Artigo 1');
    raise exception 'salvos: duplicado aceito';
  exception when unique_violation then null;
  end;
  insert into public.saved_articles (user_id, pmid, title)
  values ('00000000-0000-0000-0000-00000000000a', '11832527', 'Artigo 1') on conflict do nothing;
  begin
    insert into public.saved_articles (user_id, pmid, title)
    values ('00000000-0000-0000-0000-00000000000b', '26377054', 'Artigo 2');
    raise exception 'rls: A salvou artigo em nome de B';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

-- Como médico B: não vê os turnos nem os salvos de A
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b"}';
do $$
declare n int;
begin
  select count(*) into n from public.search_turns;
  if n <> 0 then raise exception 'rls: B viu % turnos de A', n; end if;
  select count(*) into n from public.saved_articles;
  if n <> 0 then raise exception 'rls: B viu % salvos de A', n; end if;
end $$;
commit;

select 'ok: 0003' as resultado;
