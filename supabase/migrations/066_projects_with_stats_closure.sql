-- projects_with_stats görünümüne kapanış alanlarını ekle (liste kartında geri sayım için)

create or replace view public.projects_with_stats
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.code,
  p.location,
  p.status,
  p.description,
  p.start_date,
  p.end_date,
  p.created_by,
  p.created_at,
  p.updated_at,
  p.work_start_time,
  p.work_end_time,
  p.timezone,
  p.closure_phase,
  p.closure_started_at,
  p.closure_deadline_at,
  p.closure_fast_path_deadline_at,
  coalesce(e.employee_count, 0)::int as employee_count,
  coalesce(e.active_employee_count, 0)::int as active_employee_count
from public.projects p
left join lateral (
  select
    count(*)::int as employee_count,
    count(*) filter (where emp.is_active)::int as active_employee_count
  from public.employees emp
  where emp.project_id = p.id
) e on true;

grant select on public.projects_with_stats to authenticated;
