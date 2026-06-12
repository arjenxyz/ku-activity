-- Private storage: personel fotoğrafları + başvuru/OTP ayrı bucket

-- Personel fotoğrafları artık private
update storage.buckets
set public = false
where id = 'employee-photos';

drop policy if exists "employee_photos_public_read" on storage.objects;

-- Başvuru ve OTP selfie — yalnızca service_role (API üzerinden signed URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'registration-photos',
  'registration-photos',
  false,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage object listeleme uyarısını önlemek: geniş public SELECT yok.
-- Yükleme/indirme service_role ile (createAdminClient) yapılır.

-- Personel: kalıcı storage path (signed URL API'de üretilir)
alter table public.employees
  add column if not exists photo_path text;

comment on column public.employees.photo_path is
  'employee-photos bucket içindeki object path (ör. projeId/personelId.jpg)';

comment on column public.employees.photo_url is
  'DEPRECATED — photo_path kullanın; eski public URL backfill için';

update public.employees
set photo_path = regexp_replace(photo_url, '^.*/employee-photos/', '')
where photo_path is null
  and photo_url is not null
  and photo_url like '%/employee-photos/%'
  and photo_url not like '%/employee-photos/registrations/%'
  and photo_url not like '%/employee-photos/otp-drafts/%';

update public.employees
set photo_path = photo_url
where photo_path is null
  and photo_url is not null
  and photo_url not like 'http%'
  and photo_url not like '%/%/%'; -- basit path kontrolü

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
  e.photo_path,
  p.name as project_name,
  p.status as project_status
from public.employees e
join public.projects p on p.id = e.project_id;

grant select on public.v_personnel_employee_profile to service_role;
