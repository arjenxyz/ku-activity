-- Otomatik yoklama (21:00) + işe çıkmama bildirimi

alter table public.projects
  add column if not exists auto_attendance_enabled boolean not null default false;

comment on column public.projects.auto_attendance_enabled is
  'Açıkken her gün proje saat diliminde 21:00 civarı aktif personel için otomatik yoklama alınır';

alter table public.attendance_sessions
  add column if not exists source text not null default 'manual';

do $$ begin
  alter table public.attendance_sessions
    add constraint attendance_sessions_source_check
    check (source in ('manual', 'auto'));
exception
  when duplicate_object then null;
end $$;

alter table public.attendance_session_checkins
  add column if not exists did_not_work boolean not null default false;

comment on column public.attendance_session_checkins.did_not_work is
  'true ise yevmiye yazılmaz — işe çıkmadı';

-- Personelin “bugün işe çıkmadım” bildirimi (otomatik yoklama öncesi)
create table if not exists public.attendance_day_absences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  work_date date not null,
  created_at timestamptz not null default now(),
  unique (employee_id, project_id, work_date)
);

create index if not exists attendance_day_absences_project_date_idx
  on public.attendance_day_absences (project_id, work_date);

alter table public.attendance_day_absences enable row level security;

drop policy if exists "attendance_day_absences_deny_all" on public.attendance_day_absences;
create policy "attendance_day_absences_deny_all" on public.attendance_day_absences
  for all using (false) with check (false);

grant select, insert, update, delete on public.attendance_day_absences to service_role;

-- Notice tiplerine did_not_work ekle
alter table public.attendance_employee_notices
  drop constraint if exists attendance_employee_notices_notice_type_check;

alter table public.attendance_employee_notices
  add constraint attendance_employee_notices_notice_type_check
  check (notice_type in ('removed_from_list', 'session_cancelled', 'did_not_work'));
