-- publish_app_release: owner rolü de yayınlayabilsin (is_developer ile uyumlu)

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
    where id = p_developer_id and role in ('developer', 'owner') and is_active = true
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
