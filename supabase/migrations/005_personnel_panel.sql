-- =============================================================================
-- Personel Paneli — özel view, RPC ve oturum yardımcıları
-- Önkoşul: 001_initial_schema.sql (+ 002 e-posta, 004 asgari/bordro önerilir)
-- =============================================================================

-- Personel profil + proje adı (sunucu tarafı okuma)
create or replace view public.v_personnel_employee_profile
with (security_invoker = true)
as
select
  e.id as employee_id,
  e.project_id,
  e.name,
  e.email,
  e.phone,
  e.position,
  e.daily_wage,
  e.hire_date,
  e.is_active,
  p.name as project_name,
  p.status as project_status
from public.employees e
join public.projects p on p.id = e.project_id;

grant select on public.v_personnel_employee_profile to service_role;

-- Personel dashboard özeti (tek RPC çağrısı)
create or replace function public.get_personnel_dashboard(p_employee_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee json;
  v_work_days numeric;
  v_gross numeric;
  v_advances numeric;
  v_deductions numeric;
  v_minimum numeric;
  v_approved_days numeric;
  v_pending_days numeric;
  v_daily_wage numeric;
begin
  select json_build_object(
    'id', e.id,
    'name', e.name,
    'email', e.email,
    'phone', e.phone,
    'position', e.position,
    'daily_wage', e.daily_wage,
    'hire_date', e.hire_date,
    'project_id', e.project_id,
    'project_name', p.name
  ), e.daily_wage
  into v_employee, v_daily_wage
  from public.employees e
  join public.projects p on p.id = e.project_id
  where e.id = p_employee_id
    and e.is_active = true;

  if v_employee is null then
    return null;
  end if;

  select
    coalesce(sum(wl.amount), 0),
    coalesce(sum(wl.amount) filter (where wl.approved = true), 0),
    coalesce(sum(wl.amount) filter (where wl.approved = false), 0)
  into v_work_days, v_approved_days, v_pending_days
  from public.work_logs wl
  where wl.employee_id = p_employee_id;

  v_gross := v_work_days * v_daily_wage;

  select coalesce(sum(d.amount), 0)
  into v_advances
  from public.deductions d
  where d.employee_id = p_employee_id
    and d.type = 'advance';

  select coalesce(sum(d.amount), 0)
  into v_deductions
  from public.deductions d
  where d.employee_id = p_employee_id
    and d.type::text in ('deduction', 'other', 'subcontractor_cut');

  -- minimum_wages tablosu 004 ile gelir; yoksa 0
  begin
    execute $q$
      select coalesce(sum(mw.amount), 0)
      from public.minimum_wages mw
      where mw.employee_id = $1
    $q$
    into v_minimum
    using p_employee_id;
  exception
    when undefined_table then
      v_minimum := 0;
  end;

  return json_build_object(
    'employee', v_employee,
    'stats', json_build_object(
      'work_days', v_work_days,
      'gross_pay', v_gross,
      'total_advances', v_advances,
      'total_deductions', v_deductions,
      'total_minimum', v_minimum,
      'net_pay', v_gross - v_advances - v_deductions,
      'approved_days', v_approved_days,
      'pending_days', v_pending_days
    )
  );
end;
$$;

-- Aylık personel özeti
create or replace view public.v_personnel_monthly_breakdown
with (security_invoker = true)
as
with work_by_month as (
  select
    wl.employee_id,
    date_trunc('month', wl.date)::date as month_start,
    sum(wl.amount) as work_days,
    sum(wl.amount) filter (where wl.approved = true) as approved_days
  from public.work_logs wl
  group by wl.employee_id, date_trunc('month', wl.date)::date
),
advances_by_month as (
  select
    d.employee_id,
    date_trunc('month', d.date)::date as month_start,
    sum(d.amount) as advances
  from public.deductions d
  where d.type = 'advance'
  group by d.employee_id, date_trunc('month', d.date)::date
),
deductions_by_month as (
  select
    d.employee_id,
    date_trunc('month', d.date)::date as month_start,
    sum(d.amount) as other_deductions
  from public.deductions d
  where d.type::text in ('deduction', 'other', 'subcontractor_cut')
  group by d.employee_id, date_trunc('month', d.date)::date
),
months as (
  select employee_id, month_start from work_by_month
  union
  select employee_id, month_start from advances_by_month
  union
  select employee_id, month_start from deductions_by_month
)
select
  e.id as employee_id,
  e.project_id,
  e.name as employee_name,
  e.daily_wage,
  m.month_start,
  coalesce(w.work_days, 0) as work_days,
  coalesce(w.approved_days, 0) as approved_days,
  coalesce(w.work_days, 0) * e.daily_wage as gross_pay,
  coalesce(a.advances, 0) as advances,
  coalesce(d.other_deductions, 0) as other_deductions,
  coalesce(w.work_days, 0) * e.daily_wage - coalesce(a.advances, 0) - coalesce(d.other_deductions, 0) as net_pay
from months m
join public.employees e on e.id = m.employee_id
left join work_by_month w
  on w.employee_id = m.employee_id and w.month_start = m.month_start
left join advances_by_month a
  on a.employee_id = m.employee_id and a.month_start = m.month_start
left join deductions_by_month d
  on d.employee_id = m.employee_id and d.month_start = m.month_start;

grant select on public.v_personnel_monthly_breakdown to service_role;

-- Oturum iptali (çıkış)
create or replace function public.revoke_personnel_session(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.personnel_sessions
  set revoked_at = now()
  where token_hash = p_token_hash
    and revoked_at is null;
  return found;
end;
$$;

-- Süresi dolmuş oturumları temizle (isteğe bağlı cron)
create or replace function public.cleanup_expired_personnel_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.personnel_sessions
  where expires_at < now() - interval '7 days'
     or (revoked_at is not null and revoked_at < now() - interval '30 days');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- E-posta ile personel bul (giriş API — pin_hash sunucuda doğrulanır)
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

-- Personel kayıt listeleri (ay filtresi opsiyonel, YYYY-MM)
create or replace function public.get_personnel_work_logs(
  p_employee_id uuid,
  p_month text default null,
  p_limit int default 200
)
returns setof public.work_logs
language sql
security definer
set search_path = public
as $$
  select wl.*
  from public.work_logs wl
  where wl.employee_id = p_employee_id
    and (
      p_month is null
      or date_trunc('month', wl.date) = to_date(p_month || '-01', 'YYYY-MM-DD')
    )
  order by wl.date desc
  limit greatest(1, least(p_limit, 500));
$$;

create or replace function public.get_personnel_deductions(
  p_employee_id uuid,
  p_month text default null,
  p_limit int default 200
)
returns setof public.deductions
language sql
security definer
set search_path = public
as $$
  select d.*
  from public.deductions d
  where d.employee_id = p_employee_id
    and (
      p_month is null
      or date_trunc('month', d.date) = to_date(p_month || '-01', 'YYYY-MM-DD')
    )
  order by d.date desc
  limit greatest(1, least(p_limit, 500));
$$;

-- İzinler (yalnızca service_role — Next.js API üzerinden)
grant execute on function public.get_personnel_dashboard(uuid) to service_role;
grant execute on function public.revoke_personnel_session(text) to service_role;
grant execute on function public.cleanup_expired_personnel_sessions() to service_role;
grant execute on function public.get_employee_for_login(text) to service_role;
grant execute on function public.get_personnel_work_logs(uuid, text, int) to service_role;
grant execute on function public.get_personnel_deductions(uuid, text, int) to service_role;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.employees to service_role;
grant select, insert, update, delete on public.personnel_sessions to service_role;
grant select on public.projects to service_role;
