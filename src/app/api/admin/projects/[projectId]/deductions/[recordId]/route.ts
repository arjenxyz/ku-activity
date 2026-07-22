import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import {
  notifyDeductionRemoved,
  notifyDeductionUpdated,
} from '@/lib/personnel-notification-service';
import { resolveAdminDisplayName } from '@/lib/admin-display-name';
import strings from '@json/src/app/api/admin/projects/[projectId]/deductions/[recordId]/route.json';

type Ctx = { params: Promise<{ projectId: string; recordId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, recordId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { date, amount, description, type, jobId } = body as {
      date?: string;
      amount?: number;
      description?: string | null;
      type?: string;
      jobId?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (date !== undefined) updates.date = date;
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description || null;
    if (type !== undefined) updates.type = type;
    if (jobId !== undefined) updates.job_id = jobId || null;

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: strings.güncellenecekAlanYok }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('deductions')
      .update(updates)
      .eq('id', recordId)
      .eq('project_id', projectId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: strings.kayıtBulunamadı }, { status: 404 });

    try {
      const actorName = await resolveAdminDisplayName(supabase, user.id, user.email);
      await notifyDeductionUpdated(supabase, {
        employeeId: data.employee_id as string,
        projectId,
        deductionId: data.id as string,
        type: String(data.type),
        amount: Number(data.amount),
        date: data.date as string,
        actorName,
      });
    } catch {
      /* bildirim isteğe bağlı */
    }

    return NextResponse.json({ record: data });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, recordId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from('deductions')
      .select('id, employee_id, type, amount, date')
      .eq('id', recordId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: strings.kayıtBulunamadı }, { status: 404 });

    const { error } = await supabase
      .from('deductions')
      .delete()
      .eq('id', recordId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      const actorName = await resolveAdminDisplayName(supabase, user.id, user.email);
      await notifyDeductionRemoved(supabase, {
        employeeId: existing.employee_id as string,
        projectId,
        deductionId: existing.id as string,
        type: String(existing.type),
        amount: Number(existing.amount),
        date: existing.date as string,
        actorName,
      });
    } catch {
      /* bildirim isteğe bağlı */
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
