-- Personel yevmiye itirazı

alter table public.work_logs
  add column if not exists employee_dispute_note text,
  add column if not exists employee_disputed_at timestamptz;

comment on column public.work_logs.employee_dispute_note is
  'Personelin "bu kayıt hatalı" itiraz metni';
comment on column public.work_logs.employee_disputed_at is
  'Personel itiraz zamanı';
