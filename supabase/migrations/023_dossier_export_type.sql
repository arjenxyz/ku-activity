-- Hukuki dosya: admin vs personel self-servis ayrımı

alter table public.legal_dossier_exports
  add column if not exists export_type text not null default 'admin';

alter table public.legal_dossier_exports
  drop constraint if exists legal_dossier_exports_type_check;

alter table public.legal_dossier_exports
  add constraint legal_dossier_exports_type_check
  check (export_type in ('admin', 'personnel_self'));

create index if not exists legal_dossier_exports_self_idx
  on public.legal_dossier_exports (employee_id, created_at desc)
  where export_type = 'personnel_self';
