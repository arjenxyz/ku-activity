import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/deductions/route.json';
import { createAdminClient } from '@/utils/supabase/admin';
import { notifyDeductionRecorded } from '@/lib/personnel-notification-service';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const deductionType = searchParams.get('deductionType');
    const month = searchParams.get('month');

    const supabase = await createClient();
    let q = supabase
      .from('deductions')
      .select('*, employees(name), project_jobs:job_id(name)')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(200);

    if (employeeId) q = q.eq('employee_id', employeeId);
    if (deductionType) q = q.eq('type', deductionType);
    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      q = q.gte('date', start).lte('date', end);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ records: data ?? [] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const { employeeId, date, type, amount, description, jobId } = await request.json();

    if (!employeeId || !date || !type || amount == null) {
      return NextResponse.json({ error: strings.zorunluAlanlarEksik }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('deductions')
      .insert({
        project_id: projectId,
        employee_id: employeeId,
        date,
        type,
        amount,
        description: description || null,
        job_id: jobId || null,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const admin = createAdminClient();
    try {
      await notifyDeductionRecorded(admin, {
        employeeId,
        projectId,
        deductionId: data.id as string,
        type,
        amount: Number(amount),
        date,
        description: description || null,
      });
    } catch {
      /* bildirim isteğe bağlı */
    }

    return NextResponse.json({ record: data }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
