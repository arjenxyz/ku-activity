-- Geçmiş / önceden yapılmış havale avansları

alter table public.advance_requests
  add column if not exists initiated_by text not null default 'employee'
    check (initiated_by in ('employee', 'admin'));

alter table public.advance_requests
  add column if not exists is_retroactive boolean not null default false;

comment on column public.advance_requests.initiated_by is
  'Talebi kim oluşturdu: employee | admin';
comment on column public.advance_requests.is_retroactive is
  'Ödeme onay/talep öncesinde yapıldı — HVL ve tarih kontrolleri atlanır';

create index if not exists advance_requests_retroactive_idx
  on public.advance_requests (project_id, is_retroactive)
  where is_retroactive = true;
