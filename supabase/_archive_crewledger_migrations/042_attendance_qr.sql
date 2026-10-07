-- Günlük QR yoklama: usta QR oluşturur, personel okutunca tam gün onaylı kayıt

create table if not exists public.project_daily_attendance_qr (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  work_date date not null,
  token text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, work_date)
);

create index if not exists project_daily_attendance_qr_project_date_idx
  on public.project_daily_attendance_qr (project_id, work_date desc);

create table if not exists public.attendance_qr_checkins (
  id uuid primary key default gen_random_uuid(),
  qr_id uuid not null references public.project_daily_attendance_qr (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_log_id uuid not null references public.work_logs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (qr_id, employee_id)
);

create index if not exists attendance_qr_checkins_qr_idx
  on public.attendance_qr_checkins (qr_id, created_at desc);

comment on table public.project_daily_attendance_qr is
  'Proje + gün için yoklama QR kodları (tek aktif, okutunca yenilenir)';
comment on table public.attendance_qr_checkins is
  'QR ile yapılan yoklama kayıtları';
