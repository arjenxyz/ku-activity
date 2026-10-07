-- Blok + ekip: otomatik yevmiye/kesinti ataması, iş kalemi blok bağlantısı

create table if not exists public.project_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_blocks_project_idx
  on public.project_blocks (project_id, sort_order);

drop trigger if exists project_blocks_updated_at on public.project_blocks;
create trigger project_blocks_updated_at
  before update on public.project_blocks
  for each row execute function public.set_updated_at();

create table if not exists public.project_teams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  block_id uuid references public.project_blocks (id) on delete set null,
  current_job_id uuid references public.project_jobs (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_teams_project_idx
  on public.project_teams (project_id, sort_order);
create index if not exists project_teams_block_idx
  on public.project_teams (block_id)
  where block_id is not null;

drop trigger if exists project_teams_updated_at on public.project_teams;
create trigger project_teams_updated_at
  before update on public.project_teams
  for each row execute function public.set_updated_at();

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.project_teams (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, employee_id)
);

create unique index if not exists team_members_employee_uidx
  on public.team_members (employee_id);

create index if not exists team_members_team_idx
  on public.team_members (team_id);

alter table public.project_jobs
  add column if not exists block_id uuid references public.project_blocks (id) on delete set null;

create index if not exists project_jobs_block_idx
  on public.project_jobs (block_id)
  where block_id is not null;

alter table public.work_logs
  add column if not exists block_id uuid references public.project_blocks (id) on delete set null;

create index if not exists work_logs_block_idx
  on public.work_logs (block_id)
  where block_id is not null;

alter table public.deductions
  add column if not exists block_id uuid references public.project_blocks (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Ekip → blok / iş çözümleyicileri
-- ---------------------------------------------------------------------------
create or replace function public.resolve_employee_team_id(
  p_employee_id uuid,
  p_project_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tm.team_id
  from public.team_members tm
  inner join public.project_teams pt on pt.id = tm.team_id
  where tm.employee_id = p_employee_id
    and pt.project_id = p_project_id
  limit 1;
$$;

create or replace function public.resolve_work_log_block_id(
  p_employee_id uuid,
  p_project_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pt.block_id
  from public.team_members tm
  inner join public.project_teams pt on pt.id = tm.team_id
  inner join public.project_blocks pb on pb.id = pt.block_id
  where tm.employee_id = p_employee_id
    and pt.project_id = p_project_id
    and pb.status = 'active'
  limit 1;
$$;

create or replace function public.resolve_work_log_job_id(
  p_employee_id uuid,
  p_project_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pt.current_job_id
  from public.team_members tm
  inner join public.project_teams pt on pt.id = tm.team_id
  where tm.employee_id = p_employee_id
    and pt.project_id = p_project_id
  limit 1;
$$;

grant execute on function public.resolve_employee_team_id(uuid, uuid) to authenticated;
grant execute on function public.resolve_work_log_block_id(uuid, uuid) to authenticated;
grant execute on function public.resolve_work_log_job_id(uuid, uuid) to authenticated;

-- Çift onay tamamlanınca blok + iş otomatik ata
create or replace function public.sync_work_log_approved()
returns trigger
language plpgsql
as $$
begin
  new.approved := (
    new.admin_confirmed_at is not null
    and new.employee_confirmed_at is not null
  );

  if new.approved then
    new.approved_at := greatest(new.admin_confirmed_at, new.employee_confirmed_at);

    if new.block_id is null then
      new.block_id := public.resolve_work_log_block_id(new.employee_id, new.project_id);
    end if;

    if new.job_id is null then
      new.job_id := public.resolve_work_log_job_id(new.employee_id, new.project_id);
    end if;
  else
    new.approved_at := null;
  end if;

  new.mesai_units := case new.mesai_type
    when 'ceyrek' then 0.25
    when 'yarim' then 0.5
    when 'tam' then 1
    else 0
  end;

  return new;
end;
$$;

-- Kesinti / avans: ekip bloğuna otomatik yaz
create or replace function public.assign_deduction_block_job()
returns trigger
language plpgsql
as $$
begin
  if new.block_id is null then
    new.block_id := public.resolve_work_log_block_id(new.employee_id, new.project_id);
  end if;
  return new;
end;
$$;

drop trigger if exists deductions_assign_block on public.deductions;
create trigger deductions_assign_block
  before insert on public.deductions
  for each row execute function public.assign_deduction_block_job();

-- RLS
alter table public.project_blocks enable row level security;
alter table public.project_teams enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "project_blocks_access" on public.project_blocks;
create policy "project_blocks_access" on public.project_blocks
  for all to authenticated
  using (public.is_platform_admin() or public.can_access_project(project_id))
  with check (public.is_platform_admin() or public.can_access_project(project_id));

drop policy if exists "project_teams_access" on public.project_teams;
create policy "project_teams_access" on public.project_teams
  for all to authenticated
  using (public.is_platform_admin() or public.can_access_project(project_id))
  with check (public.is_platform_admin() or public.can_access_project(project_id));

drop policy if exists "team_members_access" on public.team_members;
create policy "team_members_access" on public.team_members
  for all to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.project_teams pt
      where pt.id = team_id
        and public.can_access_project(pt.project_id)
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.project_teams pt
      where pt.id = team_id
        and public.can_access_project(pt.project_id)
    )
  );
