-- Personel self-servis başvuru + admin onay (kod / QR)

create type public.registration_status as enum ('pending', 'approved', 'rejected', 'expired');

create table if not exists public.employee_registration_requests (
  id uuid primary key default gen_random_uuid(),
  verification_code text not null unique,
  status public.registration_status not null default 'pending',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  tc_kimlik_enc text not null,
  birth_date_enc text not null,
  iban_enc text not null,
  project_id uuid references public.projects (id) on delete set null,
  employee_id uuid references public.employees (id) on delete set null,
  approved_by uuid references auth.users (id) on delete set null,
  rejected_reason text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_registration_requests_status_idx
  on public.employee_registration_requests (status, created_at desc);

create unique index if not exists employee_registration_requests_email_pending_idx
  on public.employee_registration_requests (lower(email))
  where status = 'pending';

-- Hassas alanlar (onay sonrası personel kaydına taşınır)
create table if not exists public.employee_sensitive_data (
  employee_id uuid primary key references public.employees (id) on delete cascade,
  tc_kimlik_enc text not null,
  birth_date_enc text not null,
  iban_enc text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.employee_sensitive_data is
  'TC, doğum tarihi, IBAN — uygulama katmanında şifreli; yalnızca admin API okur';

alter table public.employee_registration_requests enable row level security;
alter table public.employee_sensitive_data enable row level security;

-- İstemciden doğrudan erişim yok (yalnızca service_role / admin API)
drop policy if exists "registration_no_client" on public.employee_registration_requests;
create policy "registration_no_client" on public.employee_registration_requests
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists "sensitive_admin_only" on public.employee_sensitive_data;
create policy "sensitive_admin_only" on public.employee_sensitive_data
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.employee_registration_requests to service_role;
grant select, insert, update, delete on public.employee_sensitive_data to service_role;

drop trigger if exists employee_registration_requests_updated_at on public.employee_registration_requests;
create trigger employee_registration_requests_updated_at
  before update on public.employee_registration_requests
  for each row execute function public.set_updated_at();

drop trigger if exists employee_sensitive_data_updated_at on public.employee_sensitive_data;
create trigger employee_sensitive_data_updated_at
  before update on public.employee_sensitive_data
  for each row execute function public.set_updated_at();
