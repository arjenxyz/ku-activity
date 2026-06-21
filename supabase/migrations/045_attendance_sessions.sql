-- Yoklama oturumu: okutma = listeye ekle, bitir = yevmiye yaz

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  work_date date not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  started_by uuid references auth.users (id) on delete set null,
  completed_by uuid references auth.users (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists attendance_sessions_one_active_per_day
  on public.attendance_sessions (project_id, work_date)
  where (status = 'active');

create index if not exists attendance_sessions_project_date_idx
  on public.attendance_sessions (project_id, work_date desc);

create table if not exists public.attendance_session_checkins (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  work_log_id uuid references public.work_logs (id) on delete set null,
  unique (session_id, employee_id)
);

create index if not exists attendance_session_checkins_session_idx
  on public.attendance_session_checkins (session_id, scanned_at desc);

alter table public.project_daily_attendance_qr
  add column if not exists session_id uuid references public.attendance_sessions (id) on delete cascade;

comment on table public.attendance_sessions is
  'Günlük yoklama oturumu — bitirilince yevmiyeler yazılır';
