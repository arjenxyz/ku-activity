-- =============================================================================
-- Auth kullanıcı oluşturma hatası düzeltmesi
-- "Database error creating new user" → profiles trigger + izinler
-- Supabase SQL Editor'da çalıştırın
-- =============================================================================

-- Yeni auth kullanıcısı için profil (SECURITY DEFINER — RLS bypass)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role, is_active)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    'admin'::public.user_role,
    true
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();
  return new;
exception
  when others then
    raise exception 'profiles insert failed: %', sqlerrm;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- Auth servisinin profiles tablosuna erişimi
grant usage on schema public to supabase_auth_admin;
grant all on table public.profiles to supabase_auth_admin;
grant all on table public.profiles to service_role;

-- Service role ile profil güncelleme (kayıt API yedek yolu)
create or replace function public.upsert_admin_profile(
  p_user_id uuid,
  p_full_name text,
  p_phone text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role, is_active)
  values (p_user_id, trim(p_full_name), nullif(trim(p_phone), ''), 'admin', true)
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = 'admin',
    is_active = true,
    updated_at = now();
end;
$$;

grant execute on function public.upsert_admin_profile(uuid, text, text) to service_role;
