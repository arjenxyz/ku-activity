-- APK sürüm yönetimi: yükleme → developer onayı → yayın

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  app_type text not null check (app_type in ('personnel', 'admin')),
  version_name text not null,
  version_code integer not null check (version_code > 0),
  storage_path text not null,
  file_size bigint not null check (file_size > 0),
  sha256 text,
  release_notes text,
  status text not null default 'pending' check (status in ('pending', 'published', 'archived')),
  uploaded_by uuid references public.profiles (id) on delete set null,
  published_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint app_releases_app_version unique (app_type, version_code)
);

create index if not exists app_releases_app_status_idx
  on public.app_releases (app_type, status, version_code desc);

create index if not exists app_releases_pending_idx
  on public.app_releases (created_at desc)
  where status = 'pending';

comment on table public.app_releases is
  'Android APK sürümleri. pending: onay bekliyor; published: indirilebilir; archived: eski sürüm.';

-- Private APK bucket (service_role üzerinden yükleme/indirme)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-releases',
  'app-releases',
  false,
  157286400,
  array['application/vnd.android.package-archive', 'application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Yayınla: aynı uygulama için önceki published → archived
create or replace function public.publish_app_release(p_release_id uuid, p_developer_id uuid)
returns public.app_releases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.app_releases%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_developer_id and role = 'developer' and is_active = true
  ) then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select * into v_release
  from public.app_releases
  where id = p_release_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_release.status <> 'pending' then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  update public.app_releases
  set status = 'archived'
  where app_type = v_release.app_type
    and status = 'published';

  update public.app_releases
  set
    status = 'published',
    published_by = p_developer_id,
    published_at = now()
  where id = p_release_id
  returning * into v_release;

  return v_release;
end;
$$;

-- RLS
alter table public.app_releases enable row level security;

drop policy if exists "app_releases_developer_all" on public.app_releases;
create policy "app_releases_developer_all" on public.app_releases
  for all to authenticated
  using (public.is_developer())
  with check (public.is_developer());

grant select, insert, update, delete on public.app_releases to service_role;
grant execute on function public.publish_app_release(uuid, uuid) to authenticated, service_role;
