-- Taşeron kar takibi: iş kalemleri (alınan iş), ortak paylaşımı, yevmiye bağlantısı
-- Personel panelini etkilemez; yalnızca admin finans modülü.

create table if not exists public.project_profit_settings (
  project_id uuid primary key references public.projects (id) on delete cascade,
  share_count integer not null default 1 check (share_count >= 1),
  updated_at timestamptz not null default now()
);

drop trigger if exists project_profit_settings_updated_at on public.project_profit_settings;
create trigger project_profit_settings_updated_at
  before update on public.project_profit_settings
  for each row execute function public.set_updated_at();

create table if not exists public.project_partners (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_partners_project_idx
  on public.project_partners (project_id, sort_order);

create table if not exists public.project_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  unit_label text not null default 'm²',
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  quantity numeric(14, 2) not null check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'completed')),
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_jobs_project_idx
  on public.project_jobs (project_id, sort_order);

drop trigger if exists project_jobs_updated_at on public.project_jobs;
create trigger project_jobs_updated_at
  before update on public.project_jobs
  for each row execute function public.set_updated_at();

alter table public.work_logs
  add column if not exists job_id uuid references public.project_jobs (id) on delete set null;

create index if not exists work_logs_job_idx
  on public.work_logs (job_id)
  where job_id is not null;

-- RLS
alter table public.project_profit_settings enable row level security;
alter table public.project_partners enable row level security;
alter table public.project_jobs enable row level security;

drop policy if exists "project_profit_settings_access" on public.project_profit_settings;
create policy "project_profit_settings_access" on public.project_profit_settings
  for all to authenticated
  using (public.is_platform_admin() or public.can_access_project(project_id))
  with check (public.is_platform_admin() or public.can_access_project(project_id));

drop policy if exists "project_partners_access" on public.project_partners;
create policy "project_partners_access" on public.project_partners
  for all to authenticated
  using (public.is_platform_admin() or public.can_access_project(project_id))
  with check (public.is_platform_admin() or public.can_access_project(project_id));

drop policy if exists "project_jobs_access" on public.project_jobs;
create policy "project_jobs_access" on public.project_jobs
  for all to authenticated
  using (public.is_platform_admin() or public.can_access_project(project_id))
  with check (public.is_platform_admin() or public.can_access_project(project_id));
