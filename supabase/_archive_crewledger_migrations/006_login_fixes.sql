-- =============================================================================
-- Giriş düzeltmeleri — personel demo şifresi + service_role izinleri
-- Supabase SQL Editor'da çalıştırın (005'ten sonra veya bağımsız)
-- =============================================================================

-- Demo personel şifresi: 1234 (eski hash hatalıydı)
update public.employees
set pin_hash = '$2b$10$O8t98B9R4HPkBI5vIEWTYePomxi2b7FCi5I/fMezaAIMYrpDuErg6'
where lower(email) = 'demo@arjendev.com';

-- Giriş RPC (005 çalıştırılmadıysa oluştur)
create or replace function public.get_employee_for_login(p_email text)
returns table (
  id uuid,
  project_id uuid,
  pin_hash text,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.project_id, e.pin_hash, e.is_active
  from public.employees e
  where lower(trim(e.email)) = lower(trim(p_email))
  limit 1;
$$;

grant execute on function public.get_employee_for_login(text) to service_role;

-- Service role tablo erişimi (oturum oluşturma için)
grant usage on schema public to service_role;
grant select, insert, update, delete on public.employees to service_role;
grant select, insert, update, delete on public.personnel_sessions to service_role;
grant select on public.projects to service_role;
