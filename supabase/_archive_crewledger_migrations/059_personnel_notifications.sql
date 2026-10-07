-- Personel bildirimleri (uygulama içi + web push)

do $$ begin
  create type public.personnel_notification_type as enum (
    'attendance_reminder',
    'attendance_session_cancelled',
    'attendance_removed_from_list',
    'advance_approved',
    'advance_cash_ready',
    'advance_rejected',
    'advance_paid',
    'minimum_wage_paid',
    'salary_paid',
    'general'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.personnel_notifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  type public.personnel_notification_type not null,
  title text not null,
  body text not null,
  href text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  push_sent_at timestamptz,
  dedupe_key text,
  created_at timestamptz not null default now()
);

create index if not exists personnel_notifications_employee_created_idx
  on public.personnel_notifications (employee_id, created_at desc);

create index if not exists personnel_notifications_employee_unread_idx
  on public.personnel_notifications (employee_id)
  where read_at is null;

create unique index if not exists personnel_notifications_dedupe_idx
  on public.personnel_notifications (employee_id, dedupe_key)
  where dedupe_key is not null;

create table if not exists public.personnel_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, endpoint)
);

create index if not exists personnel_push_subscriptions_employee_idx
  on public.personnel_push_subscriptions (employee_id);

comment on table public.personnel_notifications is
  'Personel uygulama içi bildirim kutusu kayıtları';
comment on table public.personnel_push_subscriptions is
  'Personel web push abonelikleri (PWA / tarayıcı)';
