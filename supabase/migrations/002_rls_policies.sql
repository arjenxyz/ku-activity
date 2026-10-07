-- RLS + role helpers for EVENT MANAGEMENT SYSTEM
-- Apply ONLY to the new empty Supabase project.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = 'admin'
  )
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role in ('staff', 'admin')
  )
$$;

create or replace function public.is_event_staff(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.event_staff_assignments esa
      join public.profiles p on p.id = esa.profile_id
      where esa.event_id = p_event_id
        and esa.profile_id = auth.uid()
        and p.is_active = true
        and p.role in ('staff', 'admin')
    )
$$;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_event_staff(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_days enable row level security;
alter table public.event_activities enable row level security;
alter table public.event_registrations enable row level security;
alter table public.registration_selections enable row level security;
alter table public.event_attendance enable row level security;
alter table public.event_staff_assignments enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles (own + admin only — no broad staff profile listing)
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()))
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
drop policy if exists events_select_visible on public.events;
create policy events_select_visible on public.events
  for select to authenticated
  using (
    public.is_admin()
    or public.is_event_staff(id)
    or status in ('published', 'registration_open', 'registration_closed', 'completed')
  );

drop policy if exists events_admin_write on public.events;
create policy events_admin_write on public.events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- event_days / activities
-- ---------------------------------------------------------------------------
drop policy if exists event_days_select on public.event_days;
create policy event_days_select on public.event_days
  for select to authenticated
  using (
    public.is_admin()
    or public.is_event_staff(event_id)
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status in ('published', 'registration_open', 'registration_closed', 'completed')
    )
  );

drop policy if exists event_days_admin_write on public.event_days;
create policy event_days_admin_write on public.event_days
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists event_activities_select on public.event_activities;
create policy event_activities_select on public.event_activities
  for select to authenticated
  using (
    public.is_admin()
    or public.is_event_staff(event_id)
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status in ('published', 'registration_open', 'registration_closed', 'completed')
    )
  );

drop policy if exists event_activities_admin_write on public.event_activities;
create policy event_activities_admin_write on public.event_activities
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- registrations
-- ---------------------------------------------------------------------------
drop policy if exists registrations_select on public.event_registrations;
create policy registrations_select on public.event_registrations
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_admin()
    or public.is_event_staff(event_id)
  );

drop policy if exists registrations_insert_own on public.event_registrations;
create policy registrations_insert_own on public.event_registrations
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists registrations_update_own_or_admin on public.event_registrations;
create policy registrations_update_own_or_admin on public.event_registrations
  for update to authenticated
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- registration_selections
-- ---------------------------------------------------------------------------
drop policy if exists registration_selections_select on public.registration_selections;
create policy registration_selections_select on public.registration_selections
  for select to authenticated
  using (
    exists (
      select 1 from public.event_registrations r
      where r.id = registration_id
        and (
          r.profile_id = auth.uid()
          or public.is_admin()
          or public.is_event_staff(r.event_id)
        )
    )
  );

drop policy if exists registration_selections_write_own on public.registration_selections;
create policy registration_selections_write_own on public.registration_selections
  for all to authenticated
  using (
    exists (
      select 1 from public.event_registrations r
      where r.id = registration_id
        and (r.profile_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.event_registrations r
      where r.id = registration_id
        and (r.profile_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
drop policy if exists attendance_select on public.event_attendance;
create policy attendance_select on public.event_attendance
  for select to authenticated
  using (
    exists (
      select 1 from public.event_registrations r
      where r.id = registration_id
        and (
          r.profile_id = auth.uid()
          or public.is_admin()
          or public.is_event_staff(r.event_id)
        )
    )
  );

drop policy if exists attendance_insert_staff on public.event_attendance;
create policy attendance_insert_staff on public.event_attendance
  for insert to authenticated
  with check (
    exists (
      select 1 from public.event_registrations r
      where r.id = registration_id
        and (public.is_admin() or public.is_event_staff(r.event_id))
    )
  );

-- ---------------------------------------------------------------------------
-- staff assignments
-- ---------------------------------------------------------------------------
drop policy if exists staff_assignments_select on public.event_staff_assignments;
create policy staff_assignments_select on public.event_staff_assignments
  for select to authenticated
  using (
    public.is_admin()
    or profile_id = auth.uid()
  );

drop policy if exists staff_assignments_admin_write on public.event_staff_assignments;
create policy staff_assignments_admin_write on public.event_staff_assignments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit logs
-- ---------------------------------------------------------------------------
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated
  using (public.is_admin());

drop policy if exists audit_logs_insert_authenticated on public.audit_logs;
create policy audit_logs_insert_authenticated on public.audit_logs
  for insert to authenticated
  with check (
    public.is_admin()
    or public.is_staff()
    or actor_id = auth.uid()
  );

-- Note: check-in token verification & export APIs should prefer server routes
-- with the service-role client (never expose SUPABASE_SERVICE_ROLE_KEY to the browser).
