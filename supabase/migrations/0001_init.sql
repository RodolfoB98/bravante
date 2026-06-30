-- =====================================================================
-- Lista de Presença de Treinamentos — esquema inicial
-- Cole este arquivo no SQL Editor do Supabase e clique em Run.
-- =====================================================================

-- ---------- PERFIS (espelho de auth.users com papel) -----------------
create table if not exists public.profiles (
  id        uuid primary key references auth.users (id) on delete cascade,
  nome      text,
  email     text,
  empresa   text default 'Bravante',
  role      text not null default 'participante'
            check (role in ('lider', 'participante')),
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- TREINAMENTOS ---------------------------------------------
create table if not exists public.treinamentos (
  id               uuid primary key default gen_random_uuid(),
  nome_treinamento text not null,
  instrutor        text,
  carga_horaria    text,
  local            text,
  data_treinamento date,
  status           text not null default 'aberto'
                   check (status in ('aberto', 'em_andamento', 'encerrado')),
  criado_por       uuid not null references auth.users (id) on delete cascade,
  created_at       timestamptz not null default now()
);

-- ---------- INSCRIÇÕES / PRESENÇAS -----------------------------------
create table if not exists public.inscricoes (
  id             uuid primary key default gen_random_uuid(),
  treinamento_id uuid not null references public.treinamentos (id) on delete cascade,
  participante_id uuid not null references auth.users (id) on delete cascade,
  nome           text not null,
  funcao         text,
  empresa        text,
  assinatura     text,          -- PNG da assinatura em data URL (base64)
  assinado_em    timestamptz,
  created_at     timestamptz not null default now(),
  unique (treinamento_id, participante_id)
);

-- =====================================================================
-- SEGURANÇA (Row Level Security)
-- =====================================================================
alter table public.profiles     enable row level security;
alter table public.treinamentos enable row level security;
alter table public.inscricoes   enable row level security;

-- Helper: papel do usuário logado
create or replace function public.meu_papel()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ----- PROFILES -----
-- qualquer usuário autenticado pode ler nomes (necessário nas listas)
create policy "perfis visíveis para autenticados"
  on public.profiles for select to authenticated using (true);
create policy "edita o próprio perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ----- TREINAMENTOS -----
-- todos autenticados enxergam (participante precisa ver os abertos)
create policy "treinamentos visíveis para autenticados"
  on public.treinamentos for select to authenticated using (true);
-- só líder cria
create policy "líder cria treinamento"
  on public.treinamentos for insert to authenticated
  with check (public.meu_papel() = 'lider' and criado_por = auth.uid());
-- líder edita/exclui os que criou
create policy "líder edita o próprio treinamento"
  on public.treinamentos for update to authenticated
  using (criado_por = auth.uid()) with check (criado_por = auth.uid());
create policy "líder exclui o próprio treinamento"
  on public.treinamentos for delete to authenticated
  using (criado_por = auth.uid());

-- ----- INSCRIÇÕES -----
-- participante vê as próprias; líder vê as dos treinamentos que criou
create policy "vê inscrições próprias ou do meu treinamento"
  on public.inscricoes for select to authenticated using (
    participante_id = auth.uid()
    or exists (
      select 1 from public.treinamentos t
      where t.id = treinamento_id and t.criado_por = auth.uid()
    )
  );
-- participante se inscreve por si mesmo
create policy "participante se inscreve"
  on public.inscricoes for insert to authenticated
  with check (participante_id = auth.uid());
-- participante atualiza a própria inscrição (assinatura/check-in)
create policy "participante atualiza a própria inscrição"
  on public.inscricoes for update to authenticated
  using (participante_id = auth.uid()) with check (participante_id = auth.uid());
-- participante pode cancelar a própria inscrição
create policy "participante cancela a própria inscrição"
  on public.inscricoes for delete to authenticated
  using (participante_id = auth.uid());
