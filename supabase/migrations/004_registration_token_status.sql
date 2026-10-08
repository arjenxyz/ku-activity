-- Encrypted check-in token for student re-display + registration status

alter table public.event_registrations
  add column if not exists checkin_token_encrypted text;

alter table public.event_registrations
  add column if not exists status text not null default 'confirmed';

alter table public.event_registrations
  drop constraint if exists event_registrations_status_check;

alter table public.event_registrations
  add constraint event_registrations_status_check
  check (status in ('pending', 'confirmed', 'cancelled'));

comment on column public.event_registrations.checkin_token_encrypted is
  'AES-GCM blob of raw check-in token for student QR re-display; staff verify via hash only';

alter table public.profiles
  add column if not exists phone text;
