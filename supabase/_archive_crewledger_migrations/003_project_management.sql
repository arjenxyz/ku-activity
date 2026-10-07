-- =============================================================================
-- ADIM 2 / 2 — Proje yönetimi şeması
-- Önce 003a_project_status_enum.sql dosyasını çalıştırıp bitmesini bekleyin.
-- Önkoşul: 001 (+ varsa 002) tamamlanmış olmalı.
-- =============================================================================

-- Eski "inactive" kayıtları "paused" yap (003a commit edildikten sonra güvenli)
update public.projects
set status = 'paused'::public.project_status
where status::text = 'inactive';

-- ---------------------------------------------------------------------------
-- Proje tablosuna yeni alanlar
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists location text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists code text;

create unique index if not exists projects_code_unique_idx
  on public.projects (lower(code))
  where code is not null and code <> '';

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_start_date_idx on public.projects (start_date desc nulls last);
create index if not exists projects_name_search_idx on public.projects using gin (to_tsvector('turkish', coalesce(name, '')));

update public.projects
set
  location = coalesce(location, 'İstanbul'),
  start_date = coalesce(start_date, current_date),
  code = coalesce(code, 'ORN-001')
where name = 'Örnek Şantiye';

-- ---------------------------------------------------------------------------
-- Proje + personel sayısı görünümü
-- ---------------------------------------------------------------------------
create or replace view public.projects_with_stats
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.code,
  p.location,
  p.status,
  p.description,
  p.start_date,
  p.end_date,
  p.created_by,
  p.created_at,
  p.updated_at,
  coalesce(e.employee_count, 0)::int as employee_count,
  coalesce(e.active_employee_count, 0)::int as active_employee_count
from public.projects p
left join lateral (
  select
    count(*)::int as employee_count,
    count(*) filter (where emp.is_active)::int as active_employee_count
  from public.employees emp
  where emp.project_id = p.id
) e on true;

grant select on public.projects_with_stats to authenticated;

-- ---------------------------------------------------------------------------
-- Güvenli proje silme
-- ---------------------------------------------------------------------------
create or replace function public.delete_project(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Yetkisiz: yalnızca yönetici proje silebilir';
  end if;

  if not exists (select 1 from public.projects where id = p_id) then
    raise exception 'Proje bulunamadı';
  end if;

  delete from public.projects where id = p_id;
end;
$$;

grant execute on function public.delete_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Trigger: yeni projede dashboard
-- ---------------------------------------------------------------------------
create or replace function public.create_project_dashboard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_dashboards (project_id, config)
  values (new.id, '{"widgets":[],"layout":{}}'::jsonb)
  on conflict (project_id) do nothing;
  return new;
end;
$$;

drop trigger if exists projects_create_dashboard on public.projects;
create trigger projects_create_dashboard
  after insert on public.projects
  for each row execute function public.create_project_dashboard();

-- ---------------------------------------------------------------------------
-- Trigger: created_by otomatik
-- ---------------------------------------------------------------------------
create or replace function public.set_project_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null and auth.uid() is not null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists projects_set_created_by on public.projects;
create trigger projects_set_created_by
  before insert on public.projects
  for each row execute function public.set_project_created_by();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
drop policy if exists "projects_admin_insert" on public.projects;
create policy "projects_admin_insert" on public.projects
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update" on public.projects
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete" on public.projects
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Personel girişi RPC
-- ---------------------------------------------------------------------------
create or replace function public.get_login_projects()
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name
  from public.projects p
  where p.status = 'active'
  order by p.name;
$$;
