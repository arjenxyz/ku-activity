-- E-posta ile PIN sıfırlama linki — 6 saatlik tekrar sınırı

alter table public.employees
  add column if not exists last_pin_reset_email_at timestamptz;

comment on column public.employees.last_pin_reset_email_at is
  'Son PIN sıfırlama e-postası gönderim zamanı (6 saatlik rate limit)';

create index if not exists employees_last_pin_reset_email_at_idx
  on public.employees (last_pin_reset_email_at desc)
  where last_pin_reset_email_at is not null;
