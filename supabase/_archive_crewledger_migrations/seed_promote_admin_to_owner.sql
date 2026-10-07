-- Admin hesabını owner yap: aynı e-posta/şifre ile admin + developer paneline girilir.
-- Supabase SQL Editor'da çalıştırın; e-postayı kendi yönetici adresinizle değiştirin.

update public.profiles p
set
  role = 'owner',
  updated_at = now()
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('newlifearjen@gmail.com');

-- Kontrol:
-- select u.email, p.role, p.full_name
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- where p.role in ('admin', 'developer', 'owner');
