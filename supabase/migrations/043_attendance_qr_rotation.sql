-- QR rotation: günde birden fazla token, tek aktif; okutunca geçersiz olur

alter table public.project_daily_attendance_qr
  drop constraint if exists project_daily_attendance_qr_project_id_work_date_key;

alter table public.project_daily_attendance_qr
  add column if not exists is_active boolean not null default true;

alter table public.project_daily_attendance_qr
  add column if not exists revoked_at timestamptz;

create unique index if not exists project_daily_attendance_qr_one_active_per_day
  on public.project_daily_attendance_qr (project_id, work_date)
  where (is_active = true);

create index if not exists project_daily_attendance_qr_token_active_idx
  on public.project_daily_attendance_qr (token)
  where (is_active = true);

comment on column public.project_daily_attendance_qr.is_active is
  'Yalnızca aktif QR/kod okutulabilir; her yoklamada yeni aktif oluşturulur';
