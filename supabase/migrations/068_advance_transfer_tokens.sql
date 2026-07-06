-- Havale avansı: dekont açıklamasına yazılacak HVL- referans kodları

create table if not exists public.advance_transfer_tokens (
  id uuid primary key default gen_random_uuid(),
  advance_request_id uuid not null references public.advance_requests (id) on delete cascade,
  token text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz not null,
  matched_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists advance_transfer_tokens_request_active_idx
  on public.advance_transfer_tokens (advance_request_id)
  where is_active = true;

create index if not exists advance_transfer_tokens_token_active_idx
  on public.advance_transfer_tokens (token)
  where is_active = true;

comment on table public.advance_transfer_tokens is
  'Havale avans dekont eşleştirmesi için HVL- kodları';

alter table public.advance_transfer_tokens enable row level security;

drop policy if exists "advance_transfer_tokens_admin_tenant" on public.advance_transfer_tokens;
create policy "advance_transfer_tokens_admin_tenant" on public.advance_transfer_tokens
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
