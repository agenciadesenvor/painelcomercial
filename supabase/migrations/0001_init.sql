-- ═══════════════════════════════════════════════════════════════════
-- Painel Comercial · Fase 1 — schema multi-tenant (SaaS)
-- Rode UMA vez, num projeto novo/limpo: Supabase → SQL Editor → cole → Run.
--
-- Modelo: cada CLIENTE do SaaS é uma "empresa" (tenant). Todo dado tem
-- empresa_id, e o RLS garante que cada login só enxerga a própria empresa.
-- Um usuário logado = um perfil, ligado a uma empresa, com um papel.
-- ═══════════════════════════════════════════════════════════════════

-- 1 · Empresas (tenants) ─────────────────────────────────────────────
create table if not exists empresas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null default 'Minha empresa',
  logo       text,
  criado_em  timestamptz not null default now()
);

-- 2 · Perfis (liga cada auth.users a uma empresa + papel) ─────────────
create table if not exists perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome       text not null default '',
  cargo      text not null default '',
  foto       text,
  papel      text not null default 'gestor' check (papel in ('gestor','vendedor')),
  criado_em  timestamptz not null default now()
);

-- 3 · Vendedores (nomes da equipe, por empresa) ──────────────────────
create table if not exists vendedores (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome       text not null
);

-- 4 · Leads ──────────────────────────────────────────────────────────
create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references empresas(id) on delete cascade,
  numero            text,
  cliente           text not null,
  telefone          text,
  cidade            text,
  estado            text,
  campanha          text,
  produto           text,
  status            text not null default 'novo',
  valor             numeric not null default 0,
  observacao        text,
  responsavel       text,
  proximo_follow_up timestamptz,
  origem_trafego    boolean not null default false,
  historico         jsonb not null default '[]',
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index if not exists leads_empresa_idx on leads(empresa_id);

-- 5 · Interações (atendimento — é onde o chat real vai cair) ──────────
create table if not exists interacoes (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  lead_id    uuid not null references leads(id) on delete cascade,
  data       timestamptz not null default now(),
  autor      text,
  canal      text not null,   -- whatsapp | ligacao | email | presencial | nota
  direcao    text not null,   -- recebido | enviado | interno
  texto      text not null
);
create index if not exists interacoes_lead_idx on interacoes(lead_id);

-- 6 · Lançamentos de tráfego (1 por mês por empresa) ─────────────────
create table if not exists lancamentos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  mes        text not null,   -- 'YYYY-MM'
  investido  numeric not null default 0,
  honorarios numeric not null default 0,
  observacao text,
  unique (empresa_id, mes)
);

-- ── Helper: empresa do usuário logado ───────────────────────────────
-- SECURITY DEFINER = roda ignorando RLS, então não há recursão ao ler perfis.
create or replace function empresa_do_usuario()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from perfis where id = auth.uid()
$$;

-- ── RLS: cada empresa só vê o que é seu ─────────────────────────────
alter table empresas    enable row level security;
alter table perfis      enable row level security;
alter table vendedores  enable row level security;
alter table leads       enable row level security;
alter table interacoes  enable row level security;
alter table lancamentos enable row level security;

create policy "empresa própria" on empresas
  for all  using (id = empresa_do_usuario())
  with check (id = empresa_do_usuario());

create policy "perfis da empresa" on perfis
  for select using (empresa_id = empresa_do_usuario());
create policy "edita o próprio perfil" on perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "dados da empresa" on vendedores
  for all  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());
create policy "dados da empresa" on leads
  for all  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());
create policy "dados da empresa" on interacoes
  for all  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());
create policy "dados da empresa" on lancamentos
  for all  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());

-- ── Novo usuário → cria empresa + perfil (gestor) automaticamente ────
create or replace function ao_criar_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare nova_empresa uuid;
begin
  insert into empresas (nome)
    values (coalesce(new.raw_user_meta_data->>'empresa', 'Minha empresa'))
    returning id into nova_empresa;
  insert into perfis (id, empresa_id, nome, papel)
    values (new.id, nova_empresa, coalesce(new.raw_user_meta_data->>'nome', ''), 'gestor');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function ao_criar_usuario();
