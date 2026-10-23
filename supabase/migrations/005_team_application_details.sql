alter table public.team_applications
  add column if not exists motivation text,
  add column if not exists experience text,
  add column if not exists availability text,
  add column if not exists skills text;
