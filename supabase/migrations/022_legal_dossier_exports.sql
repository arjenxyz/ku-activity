-- Hukuki dosya indirme kayıtları (denetim izi)

create table if not exists public.legal_dossier_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  exported_by uuid,
  exported_by_email text,
  schema_version text not null,
  section_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists legal_dossier_exports_employee_idx
  on public.legal_dossier_exports (employee_id, created_at desc);

alter table public.legal_dossier_exports enable row level security;

drop policy if exists "legal_dossier_exports_no_client" on public.legal_dossier_exports;
create policy "legal_dossier_exports_no_client" on public.legal_dossier_exports
  for all to authenticated using (false) with check (false);

grant select, insert on public.legal_dossier_exports to service_role;
