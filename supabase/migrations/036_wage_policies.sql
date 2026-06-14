-- Şirket / proje maaş ve asgari politikası (ana yetkili ayarları)
create table if not exists public.wage_policies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  use_company_default boolean not null default true,
  policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wage_policies_owner_default_uidx
  on public.wage_policies (owner_id)
  where project_id is null;

create unique index if not exists wage_policies_owner_project_uidx
  on public.wage_policies (owner_id, project_id)
  where project_id is not null;

create index if not exists wage_policies_project_idx
  on public.wage_policies (project_id)
  where project_id is not null;

drop trigger if exists wage_policies_updated_at on public.wage_policies;
create trigger wage_policies_updated_at
  before update on public.wage_policies
  for each row execute function public.set_updated_at();

alter table public.wage_policies enable row level security;

drop policy if exists "wage_policies_owner" on public.wage_policies;
create policy "wage_policies_owner" on public.wage_policies
  for all to authenticated
  using (
    public.is_platform_admin()
    or owner_id = auth.uid()
  )
  with check (
    public.is_platform_admin()
    or (
      owner_id = auth.uid()
      and (
        project_id is null
        or public.can_access_project(project_id)
      )
    )
  );
