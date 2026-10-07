-- Personel takvim gün hatası bildirimleri (yevmiye/mesai/avans/kesinti/asgari)

create type public.day_error_report_status as enum ('open', 'resolved');

create table if not exists public.day_error_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  categories text[] not null
    check (
      cardinality(categories) > 0
      and categories <@ array['work', 'mesai', 'advance', 'deduction', 'minimum']::text[]
    ),
  note text not null check (char_length(trim(note)) >= 5),
  status public.day_error_report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null
);

create index if not exists day_error_reports_project_status_idx
  on public.day_error_reports (project_id, status, work_date desc);

create index if not exists day_error_reports_employee_date_idx
  on public.day_error_reports (employee_id, work_date desc);

comment on table public.day_error_reports is
  'Personelin takvim gün özetinden bildirdiği hatalar; admin İtirazlar sayfasında çözülür';

alter table public.day_error_reports enable row level security;

drop policy if exists day_error_reports_admin_tenant on public.day_error_reports;
create policy day_error_reports_admin_tenant on public.day_error_reports
  for all to authenticated
  using (public.is_admin() and public.can_access_project(project_id))
  with check (public.is_admin() and public.can_access_project(project_id));
