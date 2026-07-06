import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import { computeNetPay } from '@/lib/minimum-wage';
import { parseMonthParam } from '@/lib/api-validation';
import { assertProjectWritable } from '@/lib/project-closure-guard';
import { logServerError } from '@/lib/safe-api-error';
import strings from '@json/src/app/api/admin/projects/[projectId]/payroll/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

function monthBounds(month: string) {
  const start = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  return { start, end, periodMonth: start };
}

type WorkAgg = { workDays: number; mesaiUnits: number };

function aggregateWorkLogs(
  rows: { employee_id: string; amount: number | string; mesai_units?: number | string | null }[]
): Map<string, WorkAgg> {
  const map = new Map<string, WorkAgg>();
  for (const row of rows) {
    const bucket = map.get(row.employee_id) ?? { workDays: 0, mesaiUnits: 0 };
    bucket.workDays += Number(row.amount) || 0;
    bucket.mesaiUnits += Number(row.mesai_units ?? 0) || 0;
    map.set(row.employee_id, bucket);
  }
  return map;
}

function aggregateAmounts(
  rows: { employee_id: string; amount: number | string }[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.employee_id, (map.get(row.employee_id) ?? 0) + (Number(row.amount) || 0));
  }
  return map;
}

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const monthParam = new URL(request.url).searchParams.get('month');
    const month = monthParam ? parseMonthParam(monthParam) : null;
    const supabase = await createClient();

    if (!monthParam) {
      const { data } = await supabase
        .from('payroll_periods')
        .select('*, payroll_lines(*, employees(name))')
        .eq('project_id', projectId)
        .order('period_month', { ascending: false })
        .limit(12);
      return NextResponse.json({ periods: data ?? [] });
    }

    if (!month) {
      return NextResponse.json({ error: strings.ayGerekliYyyyMm }, { status: 400 });
    }

    const { data } = await supabase
      .from('payroll_periods')
      .select('*, payroll_lines(*, employees(name))')
      .eq('project_id', projectId)
      .eq('period_month', `${month}-01`)
      .maybeSingle();

    return NextResponse.json({ period: data });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    await assertProjectWritable(projectId);

    const body = await request.json().catch(() => null);
    const month = body && typeof body === 'object' ? parseMonthParam((body as { month?: unknown }).month) : null;
    if (!month) return NextResponse.json({ error: strings.ayGerekliYyyyMm }, { status: 400 });

    const { start, end, periodMonth } = monthBounds(month);
    const supabase = await createClient();

    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, daily_wage')
      .eq('project_id', projectId)
      .eq('is_active', true);

    const employeeIds = (employees ?? []).map((emp) => emp.id as string);
    const lines: Array<{
      employee_id: string;
      work_days: number;
      gross_pay: number;
      advances: number;
      other_deductions: number;
      minimum_paid: number;
      net_pay: number;
      employees: { name: string };
    }> = [];

    if (employeeIds.length) {
      const [logsRes, advRes, dedRes, minRes] = await Promise.all([
        supabase
          .from('work_logs')
          .select('employee_id, amount, mesai_units')
          .in('employee_id', employeeIds)
          .gte('date', start)
          .lte('date', end)
          .eq('approved', true),
        supabase
          .from('deductions')
          .select('employee_id, amount')
          .in('employee_id', employeeIds)
          .eq('type', 'advance')
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('deductions')
          .select('employee_id, amount')
          .in('employee_id', employeeIds)
          .in('type', ['deduction', 'subcontractor_cut'])
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('minimum_wages')
          .select('employee_id, amount')
          .in('employee_id', employeeIds)
          .gte('date', start)
          .lte('date', end),
      ]);

      if (logsRes.error || advRes.error || dedRes.error || minRes.error) {
        logServerError('payroll-aggregate', logsRes.error ?? advRes.error ?? dedRes.error ?? minRes.error);
        return NextResponse.json({ error: strings.bordroHesaplanamadı }, { status: 500 });
      }

      const workByEmp = aggregateWorkLogs(logsRes.data ?? []);
      const advByEmp = aggregateAmounts(advRes.data ?? []);
      const dedByEmp = aggregateAmounts(dedRes.data ?? []);
      const minByEmp = aggregateAmounts(minRes.data ?? []);

      for (const emp of employees ?? []) {
        const work = workByEmp.get(emp.id) ?? { workDays: 0, mesaiUnits: 0 };
        const dailyWage = Number(emp.daily_wage) || 0;
        const gross = work.workDays * dailyWage + work.mesaiUnits * dailyWage;
        const advances = advByEmp.get(emp.id) ?? 0;
        const otherDed = dedByEmp.get(emp.id) ?? 0;
        const minimumPaid = minByEmp.get(emp.id) ?? 0;
        const net = computeNetPay(gross, advances, otherDed, minimumPaid);

        lines.push({
          employee_id: emp.id,
          work_days: work.workDays,
          gross_pay: gross,
          advances,
          other_deductions: otherDed,
          minimum_paid: minimumPaid,
          net_pay: net,
          employees: { name: emp.name },
        });
      }
    }

    const { data: period, error: pErr } = await supabase
      .from('payroll_periods')
      .upsert(
        {
          project_id: projectId,
          period_month: periodMonth,
          title: `${month} Bordrosu`,
          status: 'draft',
        },
        { onConflict: 'project_id,period_month' }
      )
      .select('id')
      .single();

    if (pErr) {
      logServerError('payroll-period-upsert', pErr);
      if (pErr.message.includes('minimum_wages') || pErr.message.includes('payroll')) {
        return NextResponse.json({ error: strings.err004MenuFeaturesSqlÇalıştırın, lines }, { status: 500 });
      }
      return NextResponse.json({ error: strings.bordroHesaplanamadı }, { status: 500 });
    }

    await supabase.from('payroll_lines').delete().eq('period_id', period.id);
    if (lines.length) {
      const { error: insertErr } = await supabase.from('payroll_lines').insert(
        lines.map((l) => ({
          period_id: period.id,
          employee_id: l.employee_id,
          work_days: l.work_days,
          gross_pay: l.gross_pay,
          advances: l.advances,
          other_deductions: l.other_deductions,
          minimum_paid: l.minimum_paid,
          net_pay: l.net_pay,
        }))
      );
      if (insertErr) {
        logServerError('payroll-lines-insert', insertErr);
        return NextResponse.json({ error: strings.bordroHesaplanamadı }, { status: 500 });
      }
    }

    return NextResponse.json({ periodId: period.id, lines });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
