-- Yönetici kayıt onboarding alanları (profiles)

alter table public.profiles
  add column if not exists company_name text,
  add column if not exists job_title text,
  add column if not exists city text,
  add column if not exists team_size text,
  add column if not exists project_count text,
  add column if not exists referral_source text;

create or replace function public.upsert_admin_profile(
  p_user_id uuid,
  p_full_name text,
  p_phone text default null,
  p_company_name text default null,
  p_job_title text default null,
  p_city text default null,
  p_team_size text default null,
  p_project_count text default null,
  p_referral_source text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role,
    is_active,
    company_name,
    job_title,
    city,
    team_size,
    project_count,
    referral_source
  )
  values (
    p_user_id,
    trim(p_full_name),
    nullif(trim(p_phone), ''),
    'admin',
    true,
    nullif(trim(p_company_name), ''),
    nullif(trim(p_job_title), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_team_size), ''),
    nullif(trim(p_project_count), ''),
    nullif(trim(p_referral_source), '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    job_title = coalesce(excluded.job_title, public.profiles.job_title),
    city = coalesce(excluded.city, public.profiles.city),
    team_size = coalesce(excluded.team_size, public.profiles.team_size),
    project_count = coalesce(excluded.project_count, public.profiles.project_count),
    referral_source = coalesce(excluded.referral_source, public.profiles.referral_source),
    role = 'admin',
    is_active = true,
    updated_at = now();
end;
$$;

grant execute on function public.upsert_admin_profile(
  uuid, text, text, text, text, text, text, text, text
) to service_role;
