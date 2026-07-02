-- T.C. + yabanci kimlik/pasaport destekli kimlik modeli

alter table public.employee_registration_requests
  add column if not exists identity_type text,
  add column if not exists identity_number_enc text,
  add column if not exists identity_lookup_hash text;

alter table public.employee_sensitive_data
  add column if not exists identity_type text,
  add column if not exists identity_number_enc text,
  add column if not exists identity_lookup_hash text;

-- Geriye donuk veri doldurma (mevcut kayitlar T.C. kabul edilir)
update public.employee_registration_requests
set
  identity_type = coalesce(identity_type, 'tc'),
  identity_number_enc = coalesce(identity_number_enc, tc_kimlik_enc),
  identity_lookup_hash = coalesce(identity_lookup_hash, tc_lookup_hash)
where identity_type is null or identity_number_enc is null;

update public.employee_sensitive_data
set
  identity_type = coalesce(identity_type, 'tc'),
  identity_number_enc = coalesce(identity_number_enc, tc_kimlik_enc),
  identity_lookup_hash = coalesce(identity_lookup_hash, tc_lookup_hash)
where identity_type is null or identity_number_enc is null;

alter table public.employee_registration_requests
  alter column tc_kimlik_enc drop not null;

alter table public.employee_sensitive_data
  alter column tc_kimlik_enc drop not null;

create unique index if not exists employee_sensitive_data_identity_lookup_hash_idx
  on public.employee_sensitive_data (identity_type, identity_lookup_hash)
  where identity_lookup_hash is not null;

create unique index if not exists employee_registration_requests_identity_pending_idx
  on public.employee_registration_requests (identity_type, identity_lookup_hash)
  where status = 'pending' and identity_lookup_hash is not null;

create or replace function public.get_employee_for_login_by_identity(
  p_identity_type text,
  p_identity_lookup_hash text
)
returns table (
  id uuid,
  project_id uuid,
  pin_hash text,
  is_active boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select e.id, e.project_id, e.pin_hash, e.is_active
  from public.employee_sensitive_data s
  join public.employees e on e.id = s.employee_id
  where s.identity_type = p_identity_type
    and s.identity_lookup_hash = p_identity_lookup_hash
  limit 1;
$$;

grant execute on function public.get_employee_for_login_by_identity(text, text) to service_role;
