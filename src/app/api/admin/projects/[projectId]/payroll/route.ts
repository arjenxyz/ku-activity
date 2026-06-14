import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import { computeNetPay } from '@/lib/minimum-wage';

type Ctx = { params: Promise<{ projectId: string }> };

function monthBounds(month: string) {
  const start = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  return { start, end, periodMonth: start };
}

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const month = new URL(request.url).searchParams.get('month');
    const supabase = await createClient();

    if (!month) {
      const { data } = await supabase
        .from('payroll_periods')
        .select('*, payroll_lines(*, employees(name))')
        .eq('project_id', projectId)
        .order('period_month', { ascending: false })
        .limit(12);
      return NextResponse.json({ periods: data ?? [] });
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
    const { month } = await request.json();
    if (!month) return NextResponse.json({ error: 'Ay gerekli (YYYY-MM)' }, { status: 400 });

    const { start, end, periodMonth } = monthBounds(month);
    const supabase = await createClient();

    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, daily_wage')
      .eq('project_id', projectId)
      .eq('is_active', true);

    const lines = [];
    for (const emp of employees ?? []) {
      const { data: logs } = await supabase
        .from('work_logs')
        .select('amount, mesai_units')
        .eq('employee_id', emp.id)
        .gte('date', start)
        .lte('date', end)
        .eq('approved', true);

      const workDays = (logs ?? []).reduce((s, l) => s + Number(l.amount), 0);
      const mesaiUnits = (logs ?? []).reduce((s, l) => s + Number(l.mesai_units ?? 0), 0);
      const gross = workDays * Number(emp.daily_wage) + mesaiUnits * Number(emp.daily_wage);

      const { data: adv } = await supabase
        .from('deductions')
        .select('amount')
        .eq('employee_id', emp.id)
        .eq('type', 'advance')
        .gte('date', start)
        .lte('date', end);

      const { data: ded } = await supabase
        .from('deductions')
        .select('amount')
        .eq('employee_id', emp.id)
        .in('type', ['deduction', 'subcontractor_cut'])
        .gte('date', start)
        .lte('date', end);

      const { data: min } = await supabase
        .from('minimum_wages')
        .select('amount')
        .eq('employee_id', emp.id)
        .gte('date', start)
        .lte('date', end);

      const advances = (adv ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const otherDed = (ded ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const minimumPaid = (min ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const net = computeNetPay(gross, advances, otherDed, minimumPaid);

      lines.push({
        employee_id: emp.id,
        work_days: workDays,
        gross_pay: gross,
        advances,
        other_deductions: otherDed,
        minimum_paid: minimumPaid,
        net_pay: net,
        employees: { name: emp.name },
      });
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
      if (pErr.message.includes('minimum_wages') || pErr.message.includes('payroll')) {
        return NextResponse.json({ error: '004_menu_features.sql çalıştırın', lines }, { status: 500 });
      }
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    await supabase.from('payroll_lines').delete().eq('period_id', period.id);
    if (lines.length) {
      await supabase.from('payroll_lines').insert(
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
    }

    return NextResponse.json({ periodId: period.id, lines });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
