-- EVENT MANAGEMENT SYSTEM — foundation schema
-- Apply ONLY to a new empty Supabase project. Do not run against CrewLedger DB.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('student', 'staff', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.event_status as enum (
    'draft',
    'published',
    'registration_open',
    'registration_closed',
    'completed',
    'archived'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (minimal — no phone / extra PII in Phase 1)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  student_no text,
  department text,
  class_year text,
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create unique index if not exists profiles_student_no_unique_idx
  on public.profiles (student_no)
  where student_no is not null;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  capacity integer,
  registration_deadline timestamptz,
  status public.event_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_capacity_positive check (capacity is null or capacity > 0),
  constraint events_time_range check (ends_at >= starts_at)
);

create index if not exists events_status_idx on public.events (status);
create index if not exists events_starts_at_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- Event days / activities
-- ---------------------------------------------------------------------------
create table if not exists public.event_days (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  day_date date not null,
  title text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, day_date)
);

create index if not exists event_days_event_id_idx on public.event_days (event_id);

create table if not exists public.event_activities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  event_day_id uuid references public.event_days (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_activities_event_id_idx on public.event_activities (event_id);
create index if not exists event_activities_day_id_idx on public.event_activities (event_day_id);

-- ---------------------------------------------------------------------------
-- Registrations
-- registration_no: human-facing (e.g. ABN-2027-000184)
-- checkin_token_hash: only hash stored; QR carries cryptographically random token
-- ---------------------------------------------------------------------------
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  registration_no text not null,
  logistics jsonb not null default '{}'::jsonb,
  checkin_token_hash text not null,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, profile_id),
  unique (registration_no),
  unique (checkin_token_hash)
);

create index if not exists event_registrations_event_id_idx on public.event_registrations (event_id);
create index if not exists event_registrations_profile_id_idx on public.event_registrations (profile_id);

create table if not exists public.registration_selections (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations (id) on delete cascade,
  event_day_id uuid references public.event_days (id) on delete cascade,
  event_activity_id uuid references public.event_activities (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint registration_selections_has_target check (
    event_day_id is not null or event_activity_id is not null
  )
);

create index if not exists registration_selections_reg_idx
  on public.registration_selections (registration_id);

-- ---------------------------------------------------------------------------
-- Attendance (multi-day: one check-in per registration per day)
-- event_day_id nullable for single-day events
-- ---------------------------------------------------------------------------
create table if not exists public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations (id) on delete cascade,
  event_day_id uuid references public.event_days (id) on delete set null,
  checked_in_by uuid references public.profiles (id) on delete set null,
  checked_in_at timestamptz not null default now()
);

-- Multi-day: one check-in per (registration, day). Single-day: one check-in when day is null.
create unique index if not exists event_attendance_reg_day_unique
  on public.event_attendance (registration_id, event_day_id)
  where event_day_id is not null;

create unique index if not exists event_attendance_reg_null_day_unique
  on public.event_attendance (registration_id)
  where event_day_id is null;

create index if not exists event_attendance_registration_idx
  on public.event_attendance (registration_id);
create index if not exists event_attendance_day_idx
  on public.event_attendance (event_day_id);

-- ---------------------------------------------------------------------------
-- Staff assignments (staff may only access assigned events)
-- ---------------------------------------------------------------------------
create table if not exists public.event_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  unique (event_id, profile_id)
);

create index if not exists event_staff_assignments_profile_idx
  on public.event_staff_assignments (profile_id);
create index if not exists event_staff_assignments_event_idx
  on public.event_staff_assignments (event_id);

-- ---------------------------------------------------------------------------
-- Audit logs (export / check-in / role changes recorded here in later phases)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

-- ---------------------------------------------------------------------------
-- updated_at helper + profile bootstrap
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists event_registrations_set_updated_at on public.event_registrations;
create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
