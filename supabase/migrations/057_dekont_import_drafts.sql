-- Bankadan paylaşılan dekont taslakları (OCR + eşleştirme, 30 dk TTL)

create table if not exists public.dekont_import_drafts (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  advance_request_id uuid references public.advance_requests (id) on delete set null,
  proof_storage_backend text,
  proof_external_id text,
  proof_file_name text not null,
  proof_mime_type text not null,
  ocr_json jsonb not null default '{}'::jsonb,
  match_json jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dekont_import_drafts_admin_idx
  on public.dekont_import_drafts (admin_user_id, created_at desc);

create index if not exists dekont_import_drafts_expires_idx
  on public.dekont_import_drafts (expires_at)
  where consumed_at is null;

alter table public.dekont_import_drafts enable row level security;

drop policy if exists "dekont_import_drafts_admin_own" on public.dekont_import_drafts;
create policy "dekont_import_drafts_admin_own" on public.dekont_import_drafts
  for all to authenticated
  using (admin_user_id = auth.uid())
  with check (admin_user_id = auth.uid());

comment on table public.dekont_import_drafts is
  'Bankadan paylaş / OCR sonrası admin onay taslağı';
