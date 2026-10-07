-- Personel yoklama bildirimleri (listeden çıkarma / oturum iptali)

create table if not exists public.attendance_employee_notices (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  work_date date not null,
  notice_type text not null check (notice_type in ('removed_from_list', 'session_cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists attendance_employee_notices_lookup_idx
  on public.attendance_employee_notices (employee_id, project_id, work_date desc, created_at desc);

comment on table public.attendance_employee_notices is
  'Personelin yoklama ekranında gösterilecek iptal / listeden çıkarma bildirimleri';
