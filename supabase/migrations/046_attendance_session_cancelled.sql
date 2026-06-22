-- Yoklama oturumu iptal durumu

alter table public.attendance_sessions
  drop constraint if exists attendance_sessions_status_check;

alter table public.attendance_sessions
  add constraint attendance_sessions_status_check
  check (status in ('active', 'completed', 'cancelled'));
