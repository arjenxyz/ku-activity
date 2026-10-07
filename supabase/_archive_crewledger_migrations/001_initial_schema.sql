-- ArjenDev Personel Takip — sıfırdan şema
-- Supabase SQL Editor'da veya CLI ile çalıştırın.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipler
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.project_status as enum ('active', 'inactive', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.deduction_type as enum ('advance', 'deduction', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_role as enum ('admin');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiller (yalnızca yönetici — auth.users ile bağlı)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Projeler
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.project_status not null default 'active',
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Personel (PIN bcrypt ile hash'lenir — düz metin saklanmaz)
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  position text,
  daily_wage numeric(12, 2) not null default 0,
  pin_hash text not null,
  is_active boolean not null default true,
  hire_date date,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_project_id_idx on public.employees (project_id);
create index if not exists employees_active_idx on public.employees (project_id, is_active);
create unique index if not exists employees_email_unique_idx on public.employees (lower(email))
  where email is not null;

-- ---------------------------------------------------------------------------
-- Personel oturumları (token hash — düz token DB'de yok)
-- ---------------------------------------------------------------------------
create table if not exists public.personnel_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists personnel_sessions_employee_idx on public.personnel_sessions (employee_id);
create index if not exists personnel_sessions_expires_idx on public.personnel_sessions (expires_at);

-- ---------------------------------------------------------------------------
-- Yevmiye & kesintiler
-- ---------------------------------------------------------------------------
create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  date date not null,
  amount numeric(12, 2) not null default 0,
  hours_worked numeric(5, 2),
  description text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists work_logs_employee_date_idx on public.work_logs (employee_id, date desc);

create table if not exists public.deductions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  date date not null,
  type public.deduction_type not null default 'advance',
  amount numeric(12, 2) not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists deductions_employee_date_idx on public.deductions (employee_id, date desc);

-- ---------------------------------------------------------------------------
-- Proje dashboard ayarları
-- ---------------------------------------------------------------------------
create table if not exists public.project_dashboards (
  project_id uuid primary key references public.projects (id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ana sayfa istatistikleri (opsiyonel)
-- ---------------------------------------------------------------------------
create table if not exists public.system_uptime (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('up', 'down')),
  checked_at timestamptz not null default now()
);

create table if not exists public.payroll_processing (
  id uuid primary key default gen_random_uuid(),
  processing_time numeric(8, 3) not null,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Yardımcı fonksiyonlar
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

-- Yönetici mi?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- Giriş ekranı: aktif projeler (PIN/hash dönmez)
create or replace function public.get_login_projects()
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name
  from public.projects p
  where p.status = 'active'
  order by p.name;
$$;

-- Giriş ekranı: projedeki aktif personel isimleri
create or replace function public.get_login_employees(p_project_id uuid)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select e.id, e.name
  from public.employees e
  where e.project_id = p_project_id
    and e.is_active = true
  order by e.name;
$$;

-- Oturum geçerli mi? (service role / sunucu tarafı)
create or replace function public.validate_personnel_session(p_token_hash text)
returns table (
  session_id uuid,
  employee_id uuid,
  project_id uuid,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ps.id as session_id,
    ps.employee_id,
    e.project_id,
    ps.expires_at
  from public.personnel_sessions ps
  join public.employees e on e.id = ps.employee_id
  where ps.token_hash = p_token_hash
    and ps.revoked_at is null
    and ps.expires_at > now()
    and e.is_active = true
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.employees enable row level security;
alter table public.personnel_sessions enable row level security;
alter table public.work_logs enable row level security;
alter table public.deductions enable row level security;
alter table public.project_dashboards enable row level security;
alter table public.system_uptime enable row level security;
alter table public.payroll_processing enable row level security;

-- Profiller
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin());

-- Projeler — yönetici tam erişim
drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Personel — yönetici tam erişim (PIN hash yalnızca admin görür)
drop policy if exists "employees_admin_all" on public.employees;
create policy "employees_admin_all" on public.employees
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Oturumlar — istemciden doğrudan erişim yok
drop policy if exists "personnel_sessions_deny_all" on public.personnel_sessions;
create policy "personnel_sessions_deny_all" on public.personnel_sessions
  for all to authenticated, anon
  using (false)
  with check (false);

-- Yevmiye & kesintiler — yönetici
drop policy if exists "work_logs_admin_all" on public.work_logs;
create policy "work_logs_admin_all" on public.work_logs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "deductions_admin_all" on public.deductions;
create policy "deductions_admin_all" on public.deductions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Dashboard
drop policy if exists "project_dashboards_admin_all" on public.project_dashboards;
create policy "project_dashboards_admin_all" on public.project_dashboards
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- İstatistik tabloları — herkes okuyabilir (ana sayfa)
drop policy if exists "system_uptime_public_read" on public.system_uptime;
create policy "system_uptime_public_read" on public.system_uptime
  for select to anon, authenticated
  using (true);

drop policy if exists "payroll_processing_public_read" on public.payroll_processing;
create policy "payroll_processing_public_read" on public.payroll_processing
  for select to anon, authenticated
  using (true);

-- Ana sayfa istatistikleri (hassas veri sızdırmaz)
create or replace function public.get_home_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'totalEmployees', (select count(*)::int from public.employees where is_active = true),
    'activeSessions', (
      select count(*)::int
      from public.personnel_sessions
      where revoked_at is null and expires_at > now()
    )
  );
$$;

-- RPC izinleri
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_login_projects() to anon, authenticated;
grant execute on function public.get_login_employees(uuid) to anon, authenticated;
grant execute on function public.get_home_stats() to anon, authenticated;
grant execute on function public.validate_personnel_session(text) to service_role;

-- ---------------------------------------------------------------------------
-- İlk veri (örnek proje — isteğe bağlı)
-- ---------------------------------------------------------------------------
insert into public.projects (name, status, description)
select 'Örnek Şantiye', 'active', 'Demo proje'
where not exists (select 1 from public.projects limit 1);

-- Örnek personel PIN: 1234 (bcrypt, cost 10)
-- Üretmek için: node -e "console.log(require('bcryptjs').hashSync('1234', 10))"
insert into public.employees (project_id, name, position, daily_wage, email, pin_hash)
select
  p.id,
  'Demo Personel',
  'İşçi',
  1500,
  'demo@arjendev.com',
  '$2b$10$O8t98B9R4HPkBI5vIEWTYePomxi2b7FCi5I/fMezaAIMYrpDuErg6'
from public.projects p
where p.name = 'Örnek Şantiye'
  and not exists (select 1 from public.employees limit 1);
