import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import { notifySalaryPaid } from '@/lib/personnel-notification-service';
import { createAdminClient } from '@/utils/supabase/admin';
import strings from '@json/src/app/api/admin/projects/[projectId]/payroll/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const { month, action } = await request.json();

    if (!month || action !== 'finalize') {
      return NextResponse.json({ error: strings.ayGerekliYyyyMm }, { status: 400 });
    }

    const periodMonth = `${month}-01`;
    const supabase = await createClient();

    const { data: period, error: periodError } = await supabase
      .from('payroll_periods')
      .select('id, status, period_month')
      .eq('project_id', projectId)
      .eq('period_month', periodMonth)
      .maybeSingle();

    if (periodError) return NextResponse.json({ error: periodError.message }, { status: 500 });
    if (!period) return NextResponse.json({ error: 'Bordro bulunamadı' }, { status: 404 });
    if (period.status === 'finalized') {
      return NextResponse.json({ ok: true, alreadyFinalized: true });
    }

    const { data: lines, error: linesError } = await supabase
      .from('payroll_lines')
      .select('employee_id, net_pay')
      .eq('period_id', period.id);

    if (linesError) return NextResponse.json({ error: linesError.message }, { status: 500 });

    const { error: updateError } = await supabase
      .from('payroll_periods')
      .update({ status: 'finalized' })
      .eq('id', period.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    const admin = createAdminClient();
    await Promise.allSettled(
      (lines ?? []).map((line) =>
        notifySalaryPaid(admin, {
          employeeId: line.employee_id as string,
          projectId,
          periodMonth: period.period_month as string,
          amount: Number(line.net_pay),
        })
      )
    );

    return NextResponse.json({ ok: true, notified: lines?.length ?? 0 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
