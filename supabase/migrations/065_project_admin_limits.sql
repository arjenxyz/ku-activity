-- Yönetici proje oluşturma: doğrulama kodu yok, en fazla 2 operasyonel proje (kapanıştakiler hariç)

create or replace function public.count_admin_operational_projects(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.projects p
  where p.created_by = p_user_id
    and coalesce(p.closure_phase, 'none') = 'none';
$$;

comment on function public.count_admin_operational_projects(uuid) is
  'Kapanış sürecindeki projeler (pending_consents, export_window, purged) hariç operasyonel proje sayısı';

create or replace function public.is_platform_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id
      and role in ('developer', 'owner')
      and is_active = true
  );
$$;

create or replace function public.get_admin_project_quota(p_user_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'operationalCount', public.count_admin_operational_projects(p_user_id),
    'limit', case when public.is_platform_admin_user(p_user_id) then null else 2 end,
    'canCreate', case
      when public.is_platform_admin_user(p_user_id) then true
      else public.count_admin_operational_projects(p_user_id) < 2
    end
  );
$$;

create or replace function public.create_project_for_admin(
  p_user_id uuid,
  p_name text,
  p_project_code text default null,
  p_location text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_description text default null,
  p_status public.project_status default 'active'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_project json;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_user_id and role in ('admin', 'owner') and is_active = true
  ) then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  if not public.is_platform_admin_user(p_user_id)
     and public.count_admin_operational_projects(p_user_id) >= 2 then
    raise exception 'ACTIVE_PROJECT_LIMIT' using errcode = 'P0001';
  end if;

  insert into public.projects (
    name,
    code,
    location,
    start_date,
    end_date,
    description,
    status,
    created_by,
    verification_code_id
  ) values (
    trim(p_name),
    nullif(trim(p_project_code), ''),
    nullif(trim(p_location), ''),
    p_start_date,
    p_end_date,
    nullif(trim(p_description), ''),
    p_status,
    p_user_id,
    null
  )
  returning id into v_project_id;

  select to_json(p.*) into v_project
  from public.projects p
  where p.id = v_project_id;

  return v_project;
end;
$$;

grant execute on function public.is_platform_admin_user(uuid) to authenticated, service_role;
grant execute on function public.count_admin_operational_projects(uuid) to authenticated, service_role;
grant execute on function public.get_admin_project_quota(uuid) to authenticated, service_role;
grant execute on function public.create_project_for_admin(
  uuid, text, text, text, date, date, text, public.project_status
) to authenticated, service_role;
