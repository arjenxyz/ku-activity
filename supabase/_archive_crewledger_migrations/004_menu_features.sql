-- =============================================================================
-- ADIM 2 — Menü özellikleri (004a commit edildikten sonra çalıştırın)
-- Asgari ödemeler, bordro, onay alanları, rapor view'ları
-- =============================================================================

-- Yevmiye onay bilgisi
alter table public.work_logs
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles (id) on delete set null;

-- Aynı gün çift yevmiye engeli
create unique index if not exists work_logs_employee_date_unique
  on public.work_logs (employee_id, date);

-- Asgari ücret ödemeleri
create table if not exists public.minimum_wages (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists minimum_wages_project_date_idx
  on public.minimum_wages (project_id, date desc);

-- Bordro dönemleri
create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  period_month date not null,
  title text,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, period_month)
);

create table if not exists public.payroll_lines (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.payroll_periods (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_days numeric(8, 2) not null default 0,
  gross_pay numeric(12, 2) not null default 0,
  advances numeric(12, 2) not null default 0,
  other_deductions numeric(12, 2) not null default 0,
  minimum_paid numeric(12, 2) not null default 0,
  net_pay numeric(12, 2) not null default 0,
  unique (period_id, employee_id)
);

-- RLS
alter table public.minimum_wages enable row level security;
alter table public.payroll_periods enable row level security;
alter table public.payroll_lines enable row level security;

drop policy if exists "minimum_wages_admin_all" on public.minimum_wages;
create policy "minimum_wages_admin_all" on public.minimum_wages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payroll_periods_admin_all" on public.payroll_periods;
create policy "payroll_periods_admin_all" on public.payroll_periods
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payroll_lines_admin_all" on public.payroll_lines;
create policy "payroll_lines_admin_all" on public.payroll_lines
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Proje finans özeti view
create or replace view public.v_project_financial_summary
with (security_invoker = true)
as
select
  p.id as project_id,
  coalesce(w.work_total, 0) as total_work_pay,
  coalesce(w.work_days, 0) as total_work_days,
  coalesce(d.advance_total, 0) as total_advances,
  coalesce(d.deduction_total, 0) as total_deductions,
  coalesce(m.minimum_total, 0) as total_minimum,
  coalesce(e.employee_count, 0) as employee_count,
  coalesce(e.active_count, 0) as active_employee_count
from public.projects p
left join lateral (
  select
    sum(wl.amount * emp.daily_wage) as work_total,
    sum(wl.amount) as work_days
  from public.work_logs wl
  join public.employees emp on emp.id = wl.employee_id
  where wl.project_id = p.id and wl.approved = true
) w on true
left join lateral (
  select
    sum(case when d.type = 'advance' then d.amount else 0 end) as advance_total,
    sum(case when d.type in ('deduction', 'subcontractor_cut') then d.amount else 0 end) as deduction_total
  from public.deductions d
  where d.project_id = p.id
) d on true
left join lateral (
  select sum(mw.amount) as minimum_total
  from public.minimum_wages mw
  where mw.project_id = p.id
) m on true
left join lateral (
  select
    count(*)::int as employee_count,
    count(*) filter (where emp.is_active)::int as active_count
  from public.employees emp
  where emp.project_id = p.id
) e on true;

grant select on public.v_project_financial_summary to authenticated;

-- Personel aylık özet (CTE ile — GROUP BY + correlated subquery hatası önlenir)
create or replace view public.v_employee_monthly_summary
with (security_invoker = true)
as
with work_by_month as (
  select
    wl.employee_id,
    date_trunc('month', wl.date)::date as month_start,
    sum(wl.amount) as work_days
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
employee_months as (
  select employee_id, month_start from work_by_month
  union
  select employee_id, month_start from advances_by_month
)
select
  e.id as employee_id,
  e.project_id,
  e.name as employee_name,
  e.daily_wage,
  em.month_start,
  coalesce(w.work_days, 0) as work_days,
  coalesce(w.work_days, 0) * e.daily_wage as gross_pay,
  coalesce(a.advances, 0) as advances
from employee_months em
join public.employees e on e.id = em.employee_id
left join work_by_month w
  on w.employee_id = em.employee_id and w.month_start = em.month_start
left join advances_by_month a
  on a.employee_id = em.employee_id and a.month_start = em.month_start;

grant select on public.v_employee_monthly_summary to authenticated;
