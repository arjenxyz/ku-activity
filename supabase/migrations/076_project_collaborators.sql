-- Yönetici ortaklar (operasyon) + ortak kodu

create table if not exists public.project_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'ops' check (role = 'ops'),
  added_by uuid references public.profiles (id) on delete set null,
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists project_collaborators_user_idx
  on public.project_collaborators (user_id);

create index if not exists project_collaborators_project_idx
  on public.project_collaborators (project_id);

create table if not exists public.project_collab_codes (
  project_id uuid primary key references public.projects (id) on delete cascade,
  code text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  rotated_at timestamptz not null default now()
);

create index if not exists project_collab_codes_code_idx
  on public.project_collab_codes (code);

alter table public.project_collaborators enable row level security;
alter table public.project_collab_codes enable row level security;

create or replace function public.is_project_collaborator(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_collaborators
    where project_id = p_project_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.owns_project(p_project_id)
    or public.is_project_collaborator(p_project_id);
$$;

grant execute on function public.is_project_collaborator(uuid) to authenticated;
grant execute on function public.can_access_project(uuid) to authenticated;

-- Collaborators: sahip yönetir; ortak kendini görebilir / kendini silebilir
drop policy if exists project_collaborators_select on public.project_collaborators;
create policy project_collaborators_select on public.project_collaborators
  for select to authenticated
  using (
    public.is_admin()
    and (
      public.owns_project(project_id)
      or public.is_platform_admin()
      or user_id = auth.uid()
    )
  );

drop policy if exists project_collaborators_insert on public.project_collaborators;
create policy project_collaborators_insert on public.project_collaborators
  for insert to authenticated
  with check (
    public.is_admin()
    and (
      public.owns_project(project_id)
      or public.is_platform_admin()
      or user_id = auth.uid()
    )
  );

drop policy if exists project_collaborators_delete on public.project_collaborators;
create policy project_collaborators_delete on public.project_collaborators
  for delete to authenticated
  using (
    public.is_admin()
    and (
      public.owns_project(project_id)
      or public.is_platform_admin()
      or user_id = auth.uid()
    )
  );

drop policy if exists project_collab_codes_select on public.project_collab_codes;
create policy project_collab_codes_select on public.project_collab_codes
  for select to authenticated
  using (
    public.is_admin()
    and (public.owns_project(project_id) or public.is_platform_admin())
  );

drop policy if exists project_collab_codes_write on public.project_collab_codes;
create policy project_collab_codes_write on public.project_collab_codes
  for all to authenticated
  using (
    public.is_admin()
    and (public.owns_project(project_id) or public.is_platform_admin())
  )
  with check (
    public.is_admin()
    and (public.owns_project(project_id) or public.is_platform_admin())
  );

comment on table public.project_collaborators is
  'Yönetici ortaklar — operasyon yetkisi (yevmiye/yoklama/avans); sahiplik created_by’da kalır';
comment on table public.project_collab_codes is
  'Proje ortak katılım kodu (ORTAK-…). Sahip üretir, diğer admin kodla katılır';
