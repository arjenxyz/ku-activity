-- Oturumlara cihaz bilgisi (ayarlar > aktif cihazlar)

alter table public.personnel_sessions
  add column if not exists user_agent text,
  add column if not exists last_seen_at timestamptz not null default now();

comment on column public.personnel_sessions.user_agent is
  'Giriş yapılan tarayıcı / uygulama user-agent';
comment on column public.personnel_sessions.last_seen_at is
  'Oturumun son aktif olduğu zaman';
