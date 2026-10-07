-- Personel kapanış: e-posta OTP ile hesap silme hızlandırma (3 dk)

alter table public.project_closure_consents
  add column if not exists acceleration_verified_at timestamptz,
  add column if not exists accelerated_deletion_at timestamptz;

create index if not exists project_closure_consents_accelerated_deletion_idx
  on public.project_closure_consents (accelerated_deletion_at)
  where accelerated_deletion_at is not null;

create table if not exists public.personnel_closure_acceleration_otp (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  email text not null,
  code_hash text not null,
  link_token text not null unique,
  attempts int not null default 0,
  verified_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists personnel_closure_accel_otp_employee_idx
  on public.personnel_closure_acceleration_otp (employee_id, created_at desc);

create index if not exists personnel_closure_accel_otp_link_idx
  on public.personnel_closure_acceleration_otp (link_token)
  where link_token is not null;

alter table public.personnel_closure_acceleration_otp enable row level security;

drop policy if exists "personnel_closure_accel_otp_no_client" on public.personnel_closure_acceleration_otp;
create policy "personnel_closure_accel_otp_no_client" on public.personnel_closure_acceleration_otp
  for all to authenticated using (false) with check (false);

grant select, insert, update, delete on public.personnel_closure_acceleration_otp to service_role;

comment on column public.project_closure_consents.accelerated_deletion_at is
  'E-posta onayı sonrası bu personelin hesabının silineceği zaman (yalnızca ilgili personel)';
