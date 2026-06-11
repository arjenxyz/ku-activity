-- =============================================================================
-- Doğrulama kodu sistemi + developer rolü (007a commit edildikten sonra)
-- =============================================================================

create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text,
  request_email text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  redeemed_by uuid references public.profiles (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  redeemed_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint verification_codes_code_normalized unique (code)
);

create index if not exists verification_codes_active_idx
  on public.verification_codes (code)
  where redeemed_at is null and revoked_at is null;

alter table public.projects
  add column if not exists verification_code_id uuid references public.verification_codes (id) on delete set null;

-- Developer mı?
create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'developer'
      and is_active = true
  );
$$;

-- Kodu normalize et
create or replace function public.normalize_verification_code(p_code text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(trim(p_code), '\s+', '', 'g'));
$$;

-- Kod geçerli mi? (henüz kullanılmamış)
create or replace function public.check_verification_code(p_code text)
returns table (code_id uuid, code text, expires_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select vc.id, vc.code, vc.expires_at
  from public.verification_codes vc
  where vc.code = public.normalize_verification_code(p_code)
    and vc.redeemed_at is null
    and vc.revoked_at is null
    and (vc.expires_at is null or vc.expires_at > now())
  limit 1;
$$;

-- Proje oluştur + kodu tek işlemde tüket
create or replace function public.create_project_with_verification(
  p_user_id uuid,
  p_verification_code text,
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
  v_code_id uuid;
  v_project_id uuid;
  v_project json;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin' and is_active = true
  ) then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select c.code_id into v_code_id
  from public.check_verification_code(p_verification_code) c;

  if v_code_id is null then
    raise exception 'INVALID_CODE' using errcode = 'P0001';
  end if;

  insert into public.projects (
    name, code, location, start_date, end_date, description, status, created_by, verification_code_id
  ) values (
    trim(p_name),
    nullif(trim(p_project_code), ''),
    nullif(trim(p_location), ''),
    p_start_date,
    p_end_date,
    nullif(trim(p_description), ''),
    p_status,
    p_user_id,
    v_code_id
  )
  returning id into v_project_id;

  update public.verification_codes
  set
    redeemed_by = p_user_id,
    project_id = v_project_id,
    redeemed_at = now()
  where id = v_code_id
    and redeemed_at is null;

  if not found then
    raise exception 'CODE_ALREADY_USED' using errcode = 'P0001';
  end if;

  select to_json(p.*) into v_project
  from public.projects p
  where p.id = v_project_id;

  return v_project;
end;
$$;

-- Developer: kod oluştur
create or replace function public.create_verification_code(
  p_developer_id uuid,
  p_code text default null,
  p_label text default null,
  p_request_email text default null,
  p_notes text default null,
  p_expires_days int default 90
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row public.verification_codes%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_developer_id and role = 'developer' and is_active = true
  ) then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_code := coalesce(
    nullif(public.normalize_verification_code(p_code), ''),
    'ARJD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))
      || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))
  );

  insert into public.verification_codes (
    code, label, request_email, notes, created_by, expires_at
  ) values (
    v_code,
    nullif(trim(p_label), ''),
    nullif(trim(lower(p_request_email)), ''),
    nullif(trim(p_notes), ''),
    p_developer_id,
    case when p_expires_days > 0 then now() + (p_expires_days || ' days')::interval else null end
  )
  returning * into v_row;

  return json_build_object(
    'id', v_row.id,
    'code', v_row.code,
    'label', v_row.label,
    'request_email', v_row.request_email,
    'expires_at', v_row.expires_at,
    'created_at', v_row.created_at
  );
end;
$$;

-- Developer: kod iptal
create or replace function public.revoke_verification_code(
  p_developer_id uuid,
  p_code_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = p_developer_id and role = 'developer' and is_active = true
  ) then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  update public.verification_codes
  set revoked_at = now()
  where id = p_code_id
    and redeemed_at is null
    and revoked_at is null;

  return found;
end;
$$;

-- RLS
alter table public.verification_codes enable row level security;

drop policy if exists "verification_codes_developer_all" on public.verification_codes;
create policy "verification_codes_developer_all" on public.verification_codes
  for all to authenticated
  using (public.is_developer())
  with check (public.is_developer());

drop policy if exists "verification_codes_admin_read_own" on public.verification_codes;
create policy "verification_codes_admin_read_own" on public.verification_codes
  for select to authenticated
  using (redeemed_by = auth.uid() or public.is_admin());

-- Profil: admin kendi kaydını görebilir; developer politikası
drop policy if exists "profiles_insert_admin_register" on public.profiles;
create policy "profiles_insert_admin_register" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'admin');

grant execute on function public.is_developer() to authenticated;
grant execute on function public.check_verification_code(text) to authenticated, service_role;
grant execute on function public.create_project_with_verification(uuid, text, text, text, text, date, date, text, public.project_status) to authenticated, service_role;
grant execute on function public.create_verification_code(uuid, text, text, text, text, int) to authenticated, service_role;
grant execute on function public.revoke_verification_code(uuid, uuid) to authenticated, service_role;

grant select, insert, update on public.verification_codes to service_role;
