-- İLK YÖNETİCİ KURULUMU
-- Auth kullanıcı UUID: 75efa6c4-b2dc-4393-9fd0-c5e09c883232
-- Supabase SQL Editor'da çalıştırın:

insert into public.profiles (id, full_name, phone, role, is_active)
values (
  '75efa6c4-b2dc-4393-9fd0-c5e09c883232'::uuid,
  'Sistem Yöneticisi',
  '5550000000',
  'admin',
  true
)
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  is_active = excluded.is_active;

-- Not: Kayıt sayfası kapalıdır. Yeni yönetici yalnızca Auth + bu insert ile eklenir.
