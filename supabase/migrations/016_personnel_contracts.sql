-- Personel sözleşmeleri ve dijital onay kayıtları

create table if not exists public.personnel_contracts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content_html text not null,
  version int not null default 1,
  is_required boolean not null default true,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personnel_contract_acceptances (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.personnel_contracts (id) on delete restrict,
  contract_version int not null,
  registration_request_id uuid references public.employee_registration_requests (id) on delete set null,
  employee_id uuid references public.employees (id) on delete set null,
  email text not null,
  full_name text not null,
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  accepted_at timestamptz not null default now(),
  scroll_completed_at timestamptz,
  user_agent text,
  created_at timestamptz not null default now()
);

create unique index if not exists personnel_contract_acceptances_reg_contract_idx
  on public.personnel_contract_acceptances (registration_request_id, contract_id)
  where registration_request_id is not null;

create index if not exists personnel_contract_acceptances_employee_idx
  on public.personnel_contract_acceptances (employee_id);

create index if not exists personnel_contract_acceptances_token_idx
  on public.personnel_contract_acceptances (access_token);

alter table public.personnel_contracts enable row level security;
alter table public.personnel_contract_acceptances enable row level security;

drop policy if exists "contracts_no_client" on public.personnel_contracts;
create policy "contracts_no_client" on public.personnel_contracts
  for all to authenticated using (false) with check (false);

drop policy if exists "contract_acceptances_no_client" on public.personnel_contract_acceptances;
create policy "contract_acceptances_no_client" on public.personnel_contract_acceptances
  for all to authenticated using (false) with check (false);

grant select, insert, update, delete on public.personnel_contracts to service_role;
grant select, insert, update, delete on public.personnel_contract_acceptances to service_role;

drop trigger if exists personnel_contracts_updated_at on public.personnel_contracts;
create trigger personnel_contracts_updated_at
  before update on public.personnel_contracts
  for each row execute function public.set_updated_at();
