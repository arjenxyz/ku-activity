-- Yoklama listesinde personel bazlı gün / mesai planı (bitirince yevmiyeye yazılır)

alter table public.attendance_session_checkins
  add column if not exists planned_amount numeric(3, 2) not null default 1
    check (planned_amount in (0.5, 1)),
  add column if not exists planned_mesai_type text not null default 'none'
    check (planned_mesai_type in ('none', 'ceyrek', 'yarim', 'tam')),
  add column if not exists planned_description text;

comment on column public.attendance_session_checkins.planned_amount is
  'Yoklama bitince yazılacak gün (0.5 veya 1)';
comment on column public.attendance_session_checkins.planned_mesai_type is
  'Yoklama bitince yazılacak mesai tipi';
