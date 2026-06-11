-- =============================================================================
-- Şema onarımı — personel listesi / giriş / fotoğraf sorunları
-- Supabase SQL Editor'da BİR KEZ çalıştırın (010 + 012 uygulanmamışsa)
-- =============================================================================

-- is_system_account (010)
alter table public.employees
  add column if not exists is_system_account boolean not null default false;

update public.employees
set is_system_account = false
where is_system_account is null;

update public.employees
set is_system_account = true
where lower(email) = 'newlifearjen@gmail.com';

-- photo_url (012)
alter table public.employees
  add column if not exists photo_url text;

-- Personel profil view
drop view if exists public.v_personnel_employee_profile;
create view public.v_personnel_employee_profile
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

-- Storage bucket (fotoğraf yükleme)
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

drop policy if exists "employee_photos_public_read" on storage.objects;
create policy "employee_photos_public_read"
  on storage.objects for select to public
  using (bucket_id = 'employee-photos');

drop policy if exists "employee_photos_admin_insert" on storage.objects;
create policy "employee_photos_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'employee-photos' and public.is_admin());

drop policy if exists "employee_photos_admin_update" on storage.objects;
create policy "employee_photos_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'employee-photos' and public.is_admin())
  with check (bucket_id = 'employee-photos' and public.is_admin());

drop policy if exists "employee_photos_admin_delete" on storage.objects;
create policy "employee_photos_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'employee-photos' and public.is_admin());

-- Giriş RPC (yeniden)
create or replace function public.get_employee_for_login(p_email text)
returns table (
  id uuid,
  project_id uuid,
  pin_hash text,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.project_id, e.pin_hash, e.is_active
  from public.employees e
  where lower(trim(e.email)) = lower(trim(p_email))
  limit 1;
$$;

grant execute on function public.get_employee_for_login(text) to service_role;
