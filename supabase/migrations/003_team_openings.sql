-- Team openings: an admin posts a call, signed-in users apply.
-- Apply ONLY to the new empty Supabase project.

create table if not exists public.team_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_open boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists team_openings_open_idx on public.team_openings (is_open, created_at desc);

create table if not exists public.team_applications (
  id uuid primary key default gen_random_uuid(),
  opening_id uuid not null references public.team_openings (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (opening_id, profile_id)
);

create index if not exists team_applications_opening_idx on public.team_applications (opening_id);

alter table public.team_openings enable row level security;
alter table public.team_applications enable row level security;

drop policy if exists team_openings_read on public.team_openings;
create policy team_openings_read on public.team_openings
  for select to anon, authenticated
  using (is_open = true or public.is_admin());

drop policy if exists team_openings_admin_write on public.team_openings;
create policy team_openings_admin_write on public.team_openings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists team_applications_read on public.team_applications;
create policy team_applications_read on public.team_applications
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

drop policy if exists team_applications_insert on public.team_applications;
create policy team_applications_insert on public.team_applications
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.team_openings opening
      where opening.id = opening_id and opening.is_open = true
    )
  );
