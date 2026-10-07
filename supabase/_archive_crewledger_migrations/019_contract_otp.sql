-- Sözleşme onayı OTP (e-posta / SMS doğrulama)

create table if not exists public.contract_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'sms')),
  email text not null,
  phone text,
  code_hash text not null,
  attempts int not null default 0,
  verified_at timestamptz,
  verification_token text unique,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists contract_otp_challenges_email_created_idx
  on public.contract_otp_challenges (email, created_at desc);

create index if not exists contract_otp_challenges_token_idx
  on public.contract_otp_challenges (verification_token)
  where verification_token is not null;

alter table public.contract_otp_challenges enable row level security;

drop policy if exists "contract_otp_no_client" on public.contract_otp_challenges;
create policy "contract_otp_no_client" on public.contract_otp_challenges
  for all to authenticated using (false) with check (false);

grant select, insert, update, delete on public.contract_otp_challenges to service_role;
