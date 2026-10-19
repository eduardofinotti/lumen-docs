-- Testa a 0005: código reutilizável aceita vários cadastros; o de uso único, só um.
insert into public.invites (code, invited_by, reusable) values ('LUMEN-TURMA', 'teste', true);
insert into public.invites (code, invited_by) values ('LUMEN-UNICO', 'teste');

do $$
begin
  assert public.is_invite_valid('a@teste.com', 'lumen-turma'), 'reutilizável deveria valer';
  insert into auth.users (email, raw_user_meta_data) values ('a@teste.com', '{"invite_code":"LUMEN-TURMA"}');
  insert into auth.users (email, raw_user_meta_data) values ('b@teste.com', '{"invite_code":"lumen-turma"}');
  assert public.is_invite_valid('c@teste.com', 'LUMEN-TURMA'), 'reutilizável deveria continuar valendo';
  assert (select uses from public.invites where code = 'LUMEN-TURMA') = 2, 'deveria contar 2 usos';
  assert (select used_at from public.invites where code = 'LUMEN-TURMA') is null, 'reutilizável não é consumido';

  insert into auth.users (email, raw_user_meta_data) values ('d@teste.com', '{"invite_code":"LUMEN-UNICO"}');
  assert not public.is_invite_valid('e@teste.com', 'LUMEN-UNICO'), 'uso único deveria estar consumido';
  begin
    insert into auth.users (email, raw_user_meta_data) values ('e@teste.com', '{"invite_code":"LUMEN-UNICO"}');
    raise exception 'uso único aceitou um segundo cadastro';
  exception when others then
    if sqlerrm not like 'Cadastro restrito%' then raise; end if;
  end;

  update public.invites set reusable = false, used_at = now() where code = 'LUMEN-TURMA';
  assert not public.is_invite_valid('f@teste.com', 'LUMEN-TURMA'), 'código encerrado não deveria valer';
  assert (select count(*) from public.profiles where id in (select id from auth.users where email in ('a@teste.com','b@teste.com','d@teste.com'))) = 3, 'perfis criados';
  raise notice '0005: ok';
end $$;
