-- Personel fotoğrafları (Supabase Storage + employees.photo_url)

alter table public.employees
  add column if not exists photo_url text;

comment on column public.employees.photo_url is
  'Supabase Storage employee-photos bucket public URL';

-- Personel profil view güncelle
create or replace view public.v_personnel_employee_profile
with (security_invoker = true)
as
select
  e.id as employee_id,
  e.project_id,
  e.name,
  e.email,
  e.phone,
  e.position,
  e.daily_wage,
  e.hire_date,
  e.is_active,
  e.photo_url,
  p.name as project_name,
  p.status as project_status
from public.employees e
join public.projects p on p.id = e.project_id;

grant select on public.v_personnel_employee_profile to service_role;

-- Dashboard RPC — photo_url dahil
create or replace function public.get_personnel_dashboard(p_employee_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee json;
  v_work_days numeric;
  v_gross numeric;
  v_advances numeric;
  v_deductions numeric;
  v_minimum numeric;
  v_approved_days numeric;
  v_pending_days numeric;
  v_daily_wage numeric;
begin
  select json_build_object(
    'id', e.id,
    'name', e.name,
    'email', e.email,
    'phone', e.phone,
    'position', e.position,
    'daily_wage', e.daily_wage,
    'hire_date', e.hire_date,
    'photo_url', e.photo_url,
    'project_id', e.project_id,
    'project_name', p.name
  ), e.daily_wage
  into v_employee, v_daily_wage
  from public.employees e
  join public.projects p on p.id = e.project_id
  where e.id = p_employee_id
    and e.is_active = true;

  if v_employee is null then
    return null;
  end if;

  select
    coalesce(sum(wl.amount), 0),
    coalesce(sum(wl.amount) filter (where wl.approved = true), 0),
    coalesce(sum(wl.amount) filter (where wl.approved = false), 0)
  into v_work_days, v_approved_days, v_pending_days
  from public.work_logs wl
  where wl.employee_id = p_employee_id;

  v_gross := v_work_days * v_daily_wage;

  select coalesce(sum(d.amount), 0)
  into v_advances
  from public.deductions d
  where d.employee_id = p_employee_id
    and d.type = 'advance';

  select coalesce(sum(d.amount), 0)
  into v_deductions
  from public.deductions d
  where d.employee_id = p_employee_id
    and d.type::text in ('deduction', 'other', 'subcontractor_cut');

  begin
    select coalesce(sum(mw.amount), 0) into v_minimum
    from public.minimum_wages mw
    where mw.employee_id = p_employee_id;
  exception when undefined_table then
    v_minimum := 0;
  end;

  return json_build_object(
    'employee', v_employee,
    'stats', json_build_object(
      'work_days', v_work_days,
      'approved_days', v_approved_days,
      'pending_days', v_pending_days,
      'gross_pay', v_gross,
      'total_advances', v_advances,
      'total_deductions', v_deductions,
      'total_minimum', v_minimum,
      'net_pay', v_gross - v_advances - v_deductions
    )
  );
end;
$$;

-- Storage bucket (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-photos',
  'employee-photos',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Herkes okuyabilir (public bucket)
drop policy if exists "employee_photos_public_read" on storage.objects;
create policy "employee_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'employee-photos');

-- Admin (authenticated + is_admin) yükleyebilir / güncelleyebilir / silebilir
drop policy if exists "employee_photos_admin_insert" on storage.objects;
create policy "employee_photos_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'employee-photos'
    and public.is_admin()
  );

drop policy if exists "employee_photos_admin_update" on storage.objects;
create policy "employee_photos_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'employee-photos' and public.is_admin())
  with check (bucket_id = 'employee-photos' and public.is_admin());

drop policy if exists "employee_photos_admin_delete" on storage.objects;
create policy "employee_photos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'employee-photos' and public.is_admin());
