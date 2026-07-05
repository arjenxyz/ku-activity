-- Proje kapanış süreci: onay kayıtları, audit ve export genişletmesi

alter table public.projects
  add column if not exists closure_phase text not null default 'none',
  add column if not exists closure_started_at timestamptz,
  add column if not exists closure_deadline_at timestamptz,
  add column if not exists closure_fast_path_deadline_at timestamptz;

alter table public.projects
  drop constraint if exists projects_closure_phase_check;

alter table public.projects
  add constraint projects_closure_phase_check
  check (closure_phase in ('none', 'pending_consents', 'export_window', 'purged'));

create table if not exists public.project_closure_consents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  data_exported_at timestamptz,
  data_export_acknowledged_at timestamptz,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, employee_id)
);

create index if not exists project_closure_consents_project_idx
  on public.project_closure_consents (project_id, consented_at desc);

drop trigger if exists project_closure_consents_updated_at on public.project_closure_consents;
create trigger project_closure_consents_updated_at
  before update on public.project_closure_consents
  for each row execute function public.set_updated_at();

create table if not exists public.project_closure_audit (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  event_type text not null,
  actor_role text,
  actor_email_masked text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_closure_audit_project_idx
  on public.project_closure_audit (project_id, created_at desc);

alter table public.project_closure_consents enable row level security;
alter table public.project_closure_audit enable row level security;

drop policy if exists "project_closure_consents_no_client" on public.project_closure_consents;
create policy "project_closure_consents_no_client" on public.project_closure_consents
  for all to authenticated using (false);

drop policy if exists "project_closure_audit_no_client" on public.project_closure_audit;
create policy "project_closure_audit_no_client" on public.project_closure_audit
  for all to authenticated using (false);

grant select, insert, update, delete on public.project_closure_consents to service_role;
grant select, insert on public.project_closure_audit to service_role;

alter table public.legal_dossier_exports
  alter column employee_id drop not null;

alter table public.legal_dossier_exports
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.legal_dossier_exports
  drop constraint if exists legal_dossier_exports_type_check;

alter table public.legal_dossier_exports
  add constraint legal_dossier_exports_type_check
  check (export_type in ('admin', 'personnel_self', 'admin_project'));

comment on column public.projects.closure_phase is
  'none | pending_consents | export_window | purged — kapanış süreci aşaması';
