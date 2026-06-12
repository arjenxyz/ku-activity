-- Yönetici kiracı izolasyonu: her admin yalnızca kendi oluşturduğu projeleri görür
-- developer / owner rolleri platform geneli erişim (destek)

-- ---------------------------------------------------------------------------
-- Yardımcı fonksiyonlar
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('developer', 'owner')
      and is_active = true
  );
$$;

create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id
      and created_by = auth.uid()
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
    or public.owns_project(p_project_id);
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.owns_project(uuid) to authenticated;
grant execute on function public.can_access_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Profiller — admin başka admin profilini okuyamaz
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Projeler
-- ---------------------------------------------------------------------------
drop policy if exists "projects_admin_all" on public.projects;
drop policy if exists "projects_admin_insert" on public.projects;
drop policy if exists "projects_admin_update" on public.projects;
drop policy if exists "projects_admin_delete" on public.projects;

create policy "projects_admin_select" on public.projects
  for select to authenticated
  using (public.is_admin() and public.can_access_project(id));

create policy "projects_admin_insert" on public.projects
  for insert to authenticated
  with check (
    public.is_admin()
    and (created_by is null or created_by = auth.uid())
  );

create policy "projects_admin_update" on public.projects
  for update to authenticated
  using (public.is_admin() and public.can_access_project(id))
  with check (public.is_admin() and public.can_access_project(id));

create policy "projects_admin_delete" on public.projects
  for delete to authenticated
  using (public.is_admin() and public.can_access_project(id));

-- ---------------------------------------------------------------------------
-- Personel
-- ---------------------------------------------------------------------------
drop policy if exists "employees_admin_all" on public.employees;
create policy "employees_admin_tenant" on public.employees
  for all to authenticated
  using (public.is_admin() and public.can_access_project(project_id))
  with check (public.is_admin() and public.can_access_project(project_id));

-- ---------------------------------------------------------------------------
-- Yevmiye, kesinti, dashboard
-- ---------------------------------------------------------------------------
drop policy if exists "work_logs_admin_all" on public.work_logs;
create policy "work_logs_admin_tenant" on public.work_logs
  for all to authenticated
  using (public.is_admin() and public.can_access_project(project_id))
  with check (public.is_admin() and public.can_access_project(project_id));

drop policy if exists "deductions_admin_all" on public.deductions;
create policy "deductions_admin_tenant" on public.deductions
  for all to authenticated
  using (public.is_admin() and public.can_access_project(project_id))
  with check (public.is_admin() and public.can_access_project(project_id));

drop policy if exists "project_dashboards_admin_all" on public.project_dashboards;
create policy "project_dashboards_admin_tenant" on public.project_dashboards
  for all to authenticated
  using (
    public.is_admin()
    and public.can_access_project(project_id)
  )
  with check (
    public.is_admin()
    and public.can_access_project(project_id)
  );

-- ---------------------------------------------------------------------------
-- Asgari ücret & bordro
-- ---------------------------------------------------------------------------
drop policy if exists "minimum_wages_admin_all" on public.minimum_wages;
create policy "minimum_wages_admin_tenant" on public.minimum_wages
  for all to authenticated
  using (public.is_admin() and public.can_access_project(project_id))
  with check (public.is_admin() and public.can_access_project(project_id));

drop policy if exists "payroll_periods_admin_all" on public.payroll_periods;
create policy "payroll_periods_admin_tenant" on public.payroll_periods
  for all to authenticated
  using (public.is_admin() and public.can_access_project(project_id))
  with check (public.is_admin() and public.can_access_project(project_id));

drop policy if exists "payroll_lines_admin_all" on public.payroll_lines;
create policy "payroll_lines_admin_tenant" on public.payroll_lines
  for all to authenticated
  using (
    public.is_admin()
    and exists (
      select 1 from public.payroll_periods pp
      where pp.id = payroll_lines.payroll_period_id
        and public.can_access_project(pp.project_id)
    )
  )
  with check (
    public.is_admin()
    and exists (
      select 1 from public.payroll_periods pp
      where pp.id = payroll_lines.payroll_period_id
        and public.can_access_project(pp.project_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Hassas personel verisi
-- ---------------------------------------------------------------------------
drop policy if exists "sensitive_admin_only" on public.employee_sensitive_data;
create policy "sensitive_admin_tenant" on public.employee_sensitive_data
  for all to authenticated
  using (
    public.is_admin()
    and exists (
      select 1 from public.employees e
      where e.id = employee_sensitive_data.employee_id
        and public.can_access_project(e.project_id)
    )
  )
  with check (
    public.is_admin()
    and exists (
      select 1 from public.employees e
      where e.id = employee_sensitive_data.employee_id
        and public.can_access_project(e.project_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Doğrulama kodları — admin yalnızca kendi kullandığı kodları görür
-- ---------------------------------------------------------------------------
drop policy if exists "verification_codes_admin_read_own" on public.verification_codes;
create policy "verification_codes_admin_read_own" on public.verification_codes
  for select to authenticated
  using (redeemed_by = auth.uid() or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- RPC: proje silme
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

  if not public.can_access_project(p_id) then
    raise exception 'Bu projeye erişim yetkiniz yok';
  end if;

  if not exists (select 1 from public.projects where id = p_id) then
    raise exception 'Proje bulunamadı';
  end if;

  delete from public.projects where id = p_id;
end;
$$;

-- Eski projeler: doğrulama kodunu kullanan yöneticiye bağla
update public.projects p
set created_by = vc.redeemed_by
from public.verification_codes vc
where p.verification_code_id = vc.id
  and p.created_by is null
  and vc.redeemed_by is not null;

create index if not exists projects_created_by_idx on public.projects (created_by);
