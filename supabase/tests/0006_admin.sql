-- Testa a 0006: só admin usa as funções do painel; bloqueado não gasta crédito.
-- Usuários do seed: A (vira admin aqui) e B (médico comum).
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-00000000000a';

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b"}';
do $$
begin
  assert not public.is_admin(), 'B não é admin';
  begin
    perform public.admin_overview();
    raise exception 'B leu o painel';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-00000000000b';
    raise exception 'B se promoveu a admin';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
do $$
declare v jsonb; v_id uuid;
begin
  assert public.is_admin(), 'A é admin';
  v := public.admin_overview();
  assert (v->>'usersTotal')::int = (select count(*) from public.admin_list_users()), 'total bate com a lista';
  assert (v->>'usersTotal')::int >= 2, 'médicos do seed';
  assert (v->>'questions')::int >= 1, 'perguntas do seed';
  assert jsonb_array_length(v->'daily') = 30, '30 dias no gráfico';
  assert (select email from public.admin_list_users() where id = '00000000-0000-0000-0000-00000000000b') = 'b@lumen.test', 'lista com e-mail';

  perform public.admin_set_credits('00000000-0000-0000-0000-00000000000b', 50);
  perform public.admin_set_blocked('00000000-0000-0000-0000-00000000000b', true);
  begin
    perform public.admin_set_blocked('00000000-0000-0000-0000-00000000000a', true);
    raise exception 'admin bloqueou a si mesmo';
  exception when invalid_parameter_value then null;
  end;

  v_id := public.admin_create_invite(null, ' lumen-turma2 ', true);
  assert (select code from public.admin_list_invites() where id = v_id) = 'LUMEN-TURMA2', 'código em maiúsculas';
  perform public.admin_create_invite('Novo@Lumen.test', null, true);
  assert (select reusable from public.admin_list_invites() where email = 'novo@lumen.test') = false, 'e-mail nunca é reutilizável';
  begin
    perform public.admin_create_invite(null, null, false);
    raise exception 'aceitou convite vazio';
  exception when invalid_parameter_value then null;
  end;
  perform public.admin_close_invite(v_id);
  perform public.admin_delete_invite((select id from public.admin_list_invites() where email = 'novo@lumen.test'));
end $$;
commit;

do $$
begin
  assert (select credits from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 50, 'créditos ajustados';
  assert not public.debit_credit('00000000-0000-0000-0000-00000000000b'), 'bloqueado não gasta crédito';
  assert not public.is_invite_valid('x@lumen.test', 'LUMEN-TURMA2'), 'código encerrado';
  assert not exists (select 1 from public.invites where email = 'novo@lumen.test'), 'convite retirado';
  raise notice '0006: ok';
end $$;
