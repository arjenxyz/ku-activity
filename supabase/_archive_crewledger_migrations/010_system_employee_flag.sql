-- Panel test / owner hesapları — şantiye personel listesinde görünmez, personel girişi çalışır

alter table public.employees
  add column if not exists is_system_account boolean not null default false;

comment on column public.employees.is_system_account is
  'true ise yalnızca personel paneli testi; proje personel listesinde gösterilmez';

-- Mevcut owner kaydını düzelt
update public.employees
set is_system_account = true
where lower(email) = 'newlifearjen@gmail.com';
