-- Kişiye özel yoklama kodu (PER-): yalnızca ilgili personelin hesabında geçerli

create table if not exists public.personnel_attendance_tokens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  token text not null unique,
  is_active boolean not null default true,
  used_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists personnel_attendance_tokens_one_active_per_employee_day
  on public.personnel_attendance_tokens (employee_id, work_date)
  where (is_active = true);

create index if not exists personnel_attendance_tokens_project_date_idx
  on public.personnel_attendance_tokens (project_id, work_date desc);

create index if not exists personnel_attendance_tokens_token_active_idx
  on public.personnel_attendance_tokens (token)
  where (is_active = true);

create table if not exists public.personnel_attendance_checkins (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.personnel_attendance_tokens (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_log_id uuid not null references public.work_logs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (token_id, employee_id)
);

create index if not exists personnel_attendance_checkins_employee_idx
  on public.personnel_attendance_checkins (employee_id, created_at desc);

comment on table public.personnel_attendance_tokens is
  'Personel + gün başına kişisel yoklama kodu (PER-)';
comment on table public.personnel_attendance_checkins is
  'Kişisel kod ile yapılan yoklama kayıtları';
