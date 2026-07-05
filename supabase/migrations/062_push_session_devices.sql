-- Push aboneliklerini personel oturumlarına bağla (aktif giriş yapılan cihazlar)

alter table public.personnel_push_subscriptions
  add column if not exists session_id uuid references public.personnel_sessions (id) on delete cascade,
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists personnel_push_subscriptions_session_idx
  on public.personnel_push_subscriptions (session_id);

create unique index if not exists personnel_push_subscriptions_session_unique
  on public.personnel_push_subscriptions (session_id)
  where session_id is not null;

comment on column public.personnel_push_subscriptions.session_id is
  'Aboneliğin bağlı olduğu personel oturumu — çıkışta veya oturum sona erince silinir';
comment on column public.personnel_push_subscriptions.last_seen_at is
  'Cihazın son aktif olduğu zaman (heartbeat)';
