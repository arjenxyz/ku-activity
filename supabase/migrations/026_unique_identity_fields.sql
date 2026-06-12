-- E-posta, telefon, T.C. ve IBAN tekilliği (lookup hash ile)

alter table public.employees
  add column if not exists phone_lookup_hash text;

create unique index if not exists employees_phone_lookup_hash_idx
  on public.employees (phone_lookup_hash)
  where phone_lookup_hash is not null;

alter table public.employee_sensitive_data
  add column if not exists iban_lookup_hash text;

create unique index if not exists employee_sensitive_data_iban_lookup_hash_idx
  on public.employee_sensitive_data (iban_lookup_hash)
  where iban_lookup_hash is not null;

alter table public.employee_registration_requests
  add column if not exists phone_lookup_hash text,
  add column if not exists iban_lookup_hash text;

create unique index if not exists employee_registration_requests_phone_pending_idx
  on public.employee_registration_requests (phone_lookup_hash)
  where status = 'pending' and phone_lookup_hash is not null;

create unique index if not exists employee_registration_requests_iban_pending_idx
  on public.employee_registration_requests (iban_lookup_hash)
  where status = 'pending' and iban_lookup_hash is not null;

comment on column public.employees.phone_lookup_hash is
  'Normalize telefon HMAC — çift kayıt engeli';
comment on column public.employee_sensitive_data.iban_lookup_hash is
  'Normalize IBAN HMAC — çift kayıt engeli';
