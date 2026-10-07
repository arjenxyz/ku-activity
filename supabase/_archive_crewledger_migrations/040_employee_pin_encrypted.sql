-- Admin panelinde mevcut PIN görüntüleme (şifreli saklama; giriş doğrulaması pin_hash ile)

alter table public.employees
  add column if not exists pin_encrypted text;

comment on column public.employees.pin_encrypted is
  'AES-GCM ile şifrelenmiş PIN — yalnızca admin panelinde gösterim için';

alter table public.employee_registration_requests
  add column if not exists pin_encrypted text;
