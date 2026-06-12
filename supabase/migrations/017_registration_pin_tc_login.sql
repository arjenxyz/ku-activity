-- Başvuruda personel PIN + T.C. kimlik ile giriş araması

alter table public.employee_registration_requests
  add column if not exists pin_hash text,
  add column if not exists tc_lookup_hash text;

create unique index if not exists employee_registration_requests_tc_pending_idx
  on public.employee_registration_requests (tc_lookup_hash)
  where status = 'pending' and tc_lookup_hash is not null;

alter table public.employee_sensitive_data
  add column if not exists tc_lookup_hash text;

create unique index if not exists employee_sensitive_data_tc_lookup_hash_idx
  on public.employee_sensitive_data (tc_lookup_hash)
  where tc_lookup_hash is not null;

create or replace function public.get_employee_for_login_by_tc(p_tc_lookup_hash text)
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
  where s.tc_lookup_hash = p_tc_lookup_hash
  limit 1;
$$;

grant execute on function public.get_employee_for_login_by_tc(text) to service_role;
