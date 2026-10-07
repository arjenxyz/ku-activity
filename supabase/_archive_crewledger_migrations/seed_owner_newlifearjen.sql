-- =============================================================================
-- newlifearjen@gmail.com — admin + developer + personel (tek kişi)
-- Önkoşul: 009a + 009_owner_access.sql çalıştırılmış olmalı
-- Auth: Supabase'de bu UUID ile kullanıcı olmalı (şifreyi Auth'ta siz belirlersiniz)
-- =============================================================================

-- 1) Profil — owner = admin panel + developer panel
insert into public.profiles (id, full_name, phone, role, is_active)
values (
  'f534d367-34b3-4a77-a556-3d8048c3640c'::uuid,
  'Arjen Owner',
  null,
  'owner',
  true
)
on conflict (id) do update set
  full_name = excluded.full_name,
  role = 'owner',
  is_active = true,
  updated_at = now();

-- 2) Personel kaydı — personel paneli (e-posta + şifre/PIN)
-- Şifre: 1234 (değiştirmek için admin panel → Personel Şifreleri)
insert into public.employees (
  project_id,
  name,
  email,
  position,
  daily_wage,
  pin_hash,
  is_active,
  is_system_account
)
select
  p.id,
  'Arjen Owner',
  'newlifearjen@gmail.com',
  'Yönetici / Sahip',
  1500,
  '$2b$10$MDpYRtiJOMOWROzPuYe58OSgfbMlx4ThJGG88gIC3Ta0a/el6B/aK',
  true,
  true
from public.projects p
where not exists (
  select 1 from public.employees e where lower(e.email) = 'newlifearjen@gmail.com'
)
order by p.created_at
limit 1;

update public.employees
set
  name = 'Arjen Owner',
  position = 'Yönetici / Sahip',
  pin_hash = '$2b$10$MDpYRtiJOMOWROzPuYe58OSgfbMlx4ThJGG88gIC3Ta0a/el6B/aK',
  is_active = true,
  is_system_account = true
where lower(email) = 'newlifearjen@gmail.com';
