-- Çift onaylı günlük yoklama + mesai (çeyrek / yarım / tam) + iş başı saatleri

do $$ begin
  create type public.mesai_type as enum ('none', 'ceyrek', 'yarim', 'tam');
exception
  when duplicate_object then null;
end $$;

alter table public.projects
  add column if not exists work_start_time time not null default '08:00',
  add column if not exists work_end_time time default '17:00';

alter table public.work_logs
  add column if not exists admin_confirmed_at timestamptz,
  add column if not exists employee_confirmed_at timestamptz,
  add column if not exists mesai_type public.mesai_type not null default 'none',
  add column if not exists mesai_units numeric(4, 2) not null default 0;

-- Eski kayıtlar: onaylı sayılanlar çift onaylı kabul edilir
update public.work_logs
set
  admin_confirmed_at = coalesce(admin_confirmed_at, approved_at, created_at),
  employee_confirmed_at = coalesce(employee_confirmed_at, approved_at, created_at)
where approved = true;

update public.work_logs
set admin_confirmed_at = coalesce(admin_confirmed_at, created_at)
where approved = false and admin_confirmed_at is null;

create or replace function public.sync_work_log_approved()
returns trigger
language plpgsql
as $$
begin
  new.approved := (
    new.admin_confirmed_at is not null
    and new.employee_confirmed_at is not null
  );

  if new.approved then
    new.approved_at := greatest(new.admin_confirmed_at, new.employee_confirmed_at);
  else
    new.approved_at := null;
  end if;

  new.mesai_units := case new.mesai_type
    when 'ceyrek' then 0.25
    when 'yarim' then 0.5
    when 'tam' then 1
    else 0
  end;

  return new;
end;
$$;

drop trigger if exists work_logs_sync_approved on public.work_logs;
create trigger work_logs_sync_approved
  before insert or update on public.work_logs
  for each row execute function public.sync_work_log_approved();

-- Aylık özet: mesai dahil toplam ücret birimi
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
    coalesce(sum(wl.amount + wl.mesai_units), 0),
    coalesce(sum(wl.amount + wl.mesai_units) filter (where wl.approved = true), 0),
    coalesce(sum(wl.amount + wl.mesai_units) filter (where wl.approved = false), 0)
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
    'work_days', v_work_days,
    'approved_days', v_approved_days,
    'pending_days', v_pending_days,
    'gross', v_gross,
    'total_advance', v_advances,
    'total_deduction', v_deductions,
    'total_minimum', v_minimum,
    'net', v_gross - v_advances - v_deductions
  );
end;
$$;
