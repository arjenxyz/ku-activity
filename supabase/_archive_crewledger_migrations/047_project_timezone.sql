-- Proje saat dilimi (yoklama penceresi hesabı için)

alter table public.projects
  add column if not exists timezone text not null default 'Europe/Istanbul';

comment on column public.projects.timezone is
  'IANA saat dilimi — yoklama penceresi iş başı/bitiş saatleriyle birlikte hesaplanır';
