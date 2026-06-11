-- Aylık personel özeti (personel paneli ay filtresi)

create or replace function public.get_personnel_month_stats(
  p_employee_id uuid,
  p_month text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily_wage numeric;
  v_month_start date;
  v_month_end date;
  v_work_days numeric;
  v_approved_days numeric;
  v_pending_days numeric;
  v_gross numeric;
  v_advances numeric;
  v_deductions numeric;
  v_minimum numeric;
begin
  v_month_start := to_date(p_month || '-01', 'YYYY-MM-DD');
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  select e.daily_wage into v_daily_wage
  from public.employees e
  where e.id = p_employee_id and e.is_active = true;

  if v_daily_wage is null then
    return null;
  end if;

  select
    coalesce(sum(wl.amount), 0),
    coalesce(sum(wl.amount) filter (where wl.approved = true), 0),
    coalesce(sum(wl.amount) filter (where wl.approved = false), 0)
  into v_work_days, v_approved_days, v_pending_days
  from public.work_logs wl
  where wl.employee_id = p_employee_id
    and wl.date between v_month_start and v_month_end;

  v_gross := v_work_days * v_daily_wage;

  select coalesce(sum(d.amount), 0) into v_advances
  from public.deductions d
  where d.employee_id = p_employee_id
    and d.type = 'advance'
    and d.date between v_month_start and v_month_end;

  select coalesce(sum(d.amount), 0) into v_deductions
  from public.deductions d
  where d.employee_id = p_employee_id
    and d.type::text in ('deduction', 'other', 'subcontractor_cut')
    and d.date between v_month_start and v_month_end;

  begin
    select coalesce(sum(mw.amount), 0) into v_minimum
    from public.minimum_wages mw
    where mw.employee_id = p_employee_id
      and mw.date between v_month_start and v_month_end;
  exception when undefined_table then
    v_minimum := 0;
  end;

  return json_build_object(
    'month', p_month,
    'work_days', v_work_days,
    'approved_days', v_approved_days,
    'pending_days', v_pending_days,
    'gross_pay', v_gross,
    'total_advances', v_advances,
    'total_deductions', v_deductions,
    'total_minimum', v_minimum,
    'net_pay', v_gross - v_advances - v_deductions
  );
end;
$$;

grant execute on function public.get_personnel_month_stats(uuid, text) to service_role;
