-- Personel PIN sıfırlama — tek kullanımlık e-posta linki

create table if not exists public.personnel_pin_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists personnel_pin_reset_tokens_employee_idx
  on public.personnel_pin_reset_tokens (employee_id, created_at desc);

create index if not exists personnel_pin_reset_tokens_active_idx
  on public.personnel_pin_reset_tokens (token_hash)
  where consumed_at is null;

alter table public.personnel_pin_reset_tokens enable row level security;

drop policy if exists "personnel_pin_reset_tokens_no_client" on public.personnel_pin_reset_tokens;
create policy "personnel_pin_reset_tokens_no_client" on public.personnel_pin_reset_tokens
  for all to authenticated using (false) with check (false);

grant select, insert, update, delete on public.personnel_pin_reset_tokens to service_role;
