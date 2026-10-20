-- Testa a 0007: só o dono vota, em resposta concluída; o painel conta os votos.
-- Conversa do seed: 1111… é do médico A, com o turno 1 concluído.

do $$
declare v_turn uuid;
begin
  select id into v_turn from public.search_turns
  where search_id = '11111111-1111-1111-1111-111111111111' and position = 1;
  perform set_config('lumen.turno', v_turn::text, false);
end $$;

-- B tenta votar na resposta de A: recusado.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b"}';
do $$
begin
  begin
    insert into public.turn_feedback (turn_id, user_id, helpful)
    values (current_setting('lumen.turno')::uuid, '00000000-0000-0000-0000-00000000000b', true);
    raise exception 'B votou na resposta de A';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

-- A vota, muda o voto e não vota em nome de B.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
do $$
declare v_turn uuid := current_setting('lumen.turno')::uuid; v jsonb;
begin
  insert into public.turn_feedback (turn_id, user_id, helpful) values (v_turn, '00000000-0000-0000-0000-00000000000a', true);
  update public.turn_feedback set helpful = false, reason = 'confusa', updated_at = now() where turn_id = v_turn;
  assert (select reason from public.turn_feedback where turn_id = v_turn) = 'confusa', 'voto mudou';

  begin
    update public.turn_feedback set helpful = true where turn_id = v_turn;
    raise exception '"sim" com motivo passou';
  exception when check_violation then null;
  end;

  begin
    insert into public.turn_feedback (turn_id, user_id, helpful) values (v_turn, '00000000-0000-0000-0000-00000000000b', true);
    raise exception 'A votou em nome de B';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.turn_feedback where turn_id = v_turn;
    raise exception 'apagou o voto';
  exception when insufficient_privilege then null;
  end;

  v := public.admin_overview();
  assert (v->>'feedbackNotHelpful')::int = 1, 'painel conta o "não"';
  assert (v->>'feedbackHelpful')::int = 0, 'painel conta o "sim"';
  assert v->'feedbackReasons'->0->>'reason' = 'confusa', 'painel conta o motivo';
end $$;
commit;

-- Resposta ainda sem conclusão (antiga) e fonte sem retratação por padrão.
do $$
begin
  assert (select conclusion from public.search_turns where id = current_setting('lumen.turno')::uuid) is null, 'conclusão vazia';
  assert not (select bool_or(retracted) from public.sources), 'fontes não retratadas por padrão';
  raise notice '0007: ok';
end $$;
