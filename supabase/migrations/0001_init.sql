-- Lúmen · schema inicial
-- Aplicar com: supabase db push  (ou colar no SQL Editor)

create extension if not exists "pgcrypto";

-- Perfis -------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  specialty text,
  crm text,
  crm_uf char(2),
  credits int not null default 20,
  created_at timestamptz not null default now()
);

-- Convites (cadastro restrito) ---------------------------------------------
-- Dois tipos: por e-mail (lista de autorizados) ou por código (uso único).
--   insert into public.invites (email, invited_by) values ('medico@exemplo.com', 'admin');
--   insert into public.invites (code, invited_by) values ('LUMEN-7K2QX9', 'admin');
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text,
  code text,
  invited_by text,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint invites_email_or_code check (email is not null or code is not null)
);
create unique index if not exists invites_email_unique on public.invites (lower(email)) where email is not null;
create unique index if not exists invites_code_unique on public.invites (upper(code)) where code is not null;

-- Usado pela tela de cadastro antes do signUp, para mostrar um erro claro.
-- A trava de verdade é o trigger abaixo.
create or replace function public.is_invite_valid(p_email text, p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.invites where email is not null and lower(email) = lower(trim(p_email)))
      or exists (
        select 1 from public.invites
        where code is not null and nullif(trim(p_code), '') is not null
          and upper(code) = upper(trim(p_code)) and used_at is null
      );
$$;

-- Cria o perfil no cadastro; recusa quem não tem convite.
-- E-mail na lista: entra. Senão, consome um código ainda não usado (de forma atômica).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code text := nullif(trim(new.raw_user_meta_data->>'invite_code'), '');
  v_invite uuid;
begin
  update public.invites set used_at = coalesce(used_at, now()), used_by = coalesce(used_by, new.id)
  where email is not null and lower(email) = lower(new.email)
  returning id into v_invite;

  if v_invite is null and v_code is not null then
    update public.invites set used_at = now(), used_by = new.id
    where code is not null and upper(code) = upper(v_code) and used_at is null
    returning id into v_invite;
  end if;

  if v_invite is null then
    raise exception 'Cadastro restrito: e-mail sem convite.';
  end if;

  insert into public.profiles (id, full_name, specialty, crm, crm_uf)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'specialty',
    new.raw_user_meta_data->>'crm',
    new.raw_user_meta_data->>'crm_uf'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Pesquisas -----------------------------------------------------------------
create type public.search_status as enum ('pending', 'done', 'error', 'no_evidence');

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  date_range text not null default '5y',        -- '1y' | '5y' | 'all'
  pubmed_query text,                            -- a busca gerada pela IA
  status public.search_status not null default 'pending',
  answer_md text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists searches_user_created on public.searches (user_id, created_at desc);

-- Artigos de cada pesquisa ----------------------------------------------------
create table if not exists public.sources (
  id bigserial primary key,
  search_id uuid not null references public.searches(id) on delete cascade,
  position int not null,                        -- o [n] da citação
  pmid text not null,
  title text not null,
  authors text,
  journal text,
  year int,
  publication_types text[],
  evidence_level text,                          -- 'high' | 'mid' | 'low'
  evidence_label text,                          -- 'Revisão sistemática', 'Coorte'...
  abstract text,
  summary_pt text,                              -- resumo em português gerado pela IA
  url text,
  unique (search_id, position)
);

-- RLS ------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.searches enable row level security;
alter table public.sources  enable row level security;
alter table public.invites  enable row level security;

create policy "perfil: dono lê"      on public.profiles for select using (auth.uid() = id);
create policy "perfil: dono edita"   on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- O usuário só altera os dados cadastrais; `credits` e `created_at` ficam só com o servidor.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, specialty, crm, crm_uf) on public.profiles to authenticated;

create policy "pesquisa: dono lê"    on public.searches for select using (auth.uid() = user_id);
create policy "pesquisa: dono cria"  on public.searches for insert with check (auth.uid() = user_id);

create policy "fontes: dono lê" on public.sources for select
  using (exists (select 1 from public.searches s where s.id = search_id and s.user_id = auth.uid()));

-- invites: só service role lê/escreve (sem policy para anon/authenticated)

-- Débito de crédito atômico (chamado pela Edge Function com service role)
create or replace function public.debit_credit(p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.profiles set credits = credits - 1
  where id = p_user and credits > 0
  returning true into ok;
  return coalesce(ok, false);
end $$;

-- Permissões das funções ----------------------------------------------------
-- No Supabase, funções novas em `public` ficam executáveis por anon e authenticated.
-- debit_credit recebe qualquer id: só a Edge Function (service role) pode chamar.
revoke execute on function public.debit_credit(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_invite_valid(text, text) from public;
grant execute on function public.is_invite_valid(text, text) to anon, authenticated;
