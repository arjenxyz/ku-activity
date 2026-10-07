-- Mevcut projede e-posta ile personel girişi (zaten 001 çalıştırdıysanız bunu da çalıştırın)

create unique index if not exists employees_email_unique_idx on public.employees (lower(email))
  where email is not null;

update public.employees
set email = 'demo@arjendev.com'
where name = 'Demo Personel'
  and (email is null or email = '');
