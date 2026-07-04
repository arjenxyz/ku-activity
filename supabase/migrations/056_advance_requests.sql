-- Personel avans talepleri: onay ve ödeme ayrı aşamalar; dekont Drive/R2'de

create type public.advance_request_status as enum (
  'pending',
  'approved',
  'awaiting_receipt',
  'paid',
  'rejected',
  'cancelled',
  'expired'
);

create type public.advance_payment_method as enum ('bank_transfer', 'cash');

create table if not exists public.advance_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  requested_amount numeric(12, 2) not null check (requested_amount > 0),
  approved_amount numeric(12, 2) check (approved_amount is null or approved_amount > 0),
  employee_note text,
  admin_note text,
  status public.advance_request_status not null default 'pending',
  payment_method public.advance_payment_method,
  job_id uuid references public.project_jobs (id) on delete set null,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  paid_by uuid references auth.users (id) on delete set null,
  rejection_reason text,
  proof_storage_backend text,
  proof_external_id text,
  proof_file_name text,
  proof_mime_type text,
  proof_reference_no text,
  proof_ocr_json jsonb,
  deduction_id uuid references public.deductions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists advance_requests_project_status_idx
  on public.advance_requests (project_id, status, requested_at desc);

create index if not exists advance_requests_employee_idx
  on public.advance_requests (employee_id, requested_at desc);

create index if not exists advance_requests_deduction_idx
  on public.advance_requests (deduction_id)
  where deduction_id is not null;

drop trigger if exists advance_requests_updated_at on public.advance_requests;
create trigger advance_requests_updated_at
  before update on public.advance_requests
  for each row execute function public.set_updated_at();

create table if not exists public.advance_cash_tokens (
  id uuid primary key default gen_random_uuid(),
  advance_request_id uuid not null references public.advance_requests (id) on delete cascade,
  token text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists advance_cash_tokens_request_active_idx
  on public.advance_cash_tokens (advance_request_id)
  where is_active = true;

create index if not exists advance_cash_tokens_token_active_idx
  on public.advance_cash_tokens (token)
  where is_active = true;

comment on table public.advance_requests is
  'Personel avans talepleri — kesinti yalnızca paid durumunda';
comment on table public.advance_cash_tokens is
  'Nakit avans teslim onayı için AVN- kodları';

alter table public.advance_requests enable row level security;
alter table public.advance_cash_tokens enable row level security;

drop policy if exists "advance_requests_admin_tenant" on public.advance_requests;
create policy "advance_requests_admin_tenant" on public.advance_requests
  for all to authenticated
  using (public.is_admin() and public.can_access_project(project_id))
  with check (public.is_admin() and public.can_access_project(project_id));

drop policy if exists "advance_cash_tokens_admin_tenant" on public.advance_cash_tokens;
create policy "advance_cash_tokens_admin_tenant" on public.advance_cash_tokens
  for all to authenticated
  using (
    public.is_admin()
    and exists (
      select 1
      from public.advance_requests ar
      where ar.id = advance_request_id
        and public.can_access_project(ar.project_id)
    )
  )
  with check (
    public.is_admin()
    and exists (
      select 1
      from public.advance_requests ar
      where ar.id = advance_request_id
        and public.can_access_project(ar.project_id)
    )
  );
