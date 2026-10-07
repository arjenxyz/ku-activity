-- Taşeron kar: avans/kesinti ve malzeme gideri iş kalemine bağlama

alter table public.deductions
  add column if not exists job_id uuid references public.project_jobs (id) on delete set null;

create index if not exists deductions_job_idx
  on public.deductions (job_id)
  where job_id is not null;

create table if not exists public.project_job_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  job_id uuid not null references public.project_jobs (id) on delete cascade,
  date date not null default current_date,
  amount numeric(14, 2) not null check (amount > 0),
  description text,
  created_at timestamptz not null default now()
);

create index if not exists project_job_expenses_job_idx
  on public.project_job_expenses (job_id, date desc);

alter table public.project_job_expenses enable row level security;

drop policy if exists "project_job_expenses_access" on public.project_job_expenses;
create policy "project_job_expenses_access" on public.project_job_expenses
  for all to authenticated
  using (public.is_platform_admin() or public.can_access_project(project_id))
  with check (public.is_platform_admin() or public.can_access_project(project_id));
