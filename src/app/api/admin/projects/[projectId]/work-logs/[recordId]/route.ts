import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { mesaiTypeToUnits, type MesaiType } from '@/lib/work-log';
import {
  notifyWorkLogDeleted,
  notifyWorkLogUpdated,
} from '@/lib/personnel-notification-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/work-logs/[recordId]/route.json';

type Ctx = { params: Promise<{ projectId: string; recordId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, recordId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { date, amount, description, mesaiType, reconfirmAdmin, resolveDispute, jobId } = body as {
      date?: string;
      amount?: number;
      description?: string | null;
      mesaiType?: MesaiType;
      reconfirmAdmin?: boolean;
      resolveDispute?: boolean;
      jobId?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (date !== undefined) updates.date = date;
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description || null;
    if (jobId !== undefined) updates.job_id = jobId || null;
    if (mesaiType !== undefined) {
      updates.mesai_type = mesaiType;
      updates.mesai_units = mesaiTypeToUnits(mesaiType);
    }
    if (reconfirmAdmin || resolveDispute) {
      const now = new Date().toISOString();
      updates.admin_confirmed_at = now;
      updates.employee_confirmed_at = now;
      updates.approved_by = user.id;
      updates.approved = true;
      if (resolveDispute) {
        updates.employee_dispute_note = null;
        updates.employee_disputed_at = null;
      }
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: strings.güncellenecekAlanYok }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('work_logs')
      .update(updates)
      .eq('id', recordId)
      .eq('project_id', projectId)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: strings.buTarihIçinZatenYevmiyeKaydı }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: strings.kayıtBulunamadı }, { status: 404 });

    try {
      await notifyWorkLogUpdated(supabase, {
        employeeId: data.employee_id as string,
        projectId,
        workLogId: data.id as string,
        date: data.date as string,
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
    await requireAdminProjectAccess(projectId);
    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from('work_logs')
      .select('id, employee_id, date')
      .eq('id', recordId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: strings.kayıtBulunamadı }, { status: 404 });

    const { error } = await supabase
      .from('work_logs')
      .delete()
      .eq('id', recordId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      await notifyWorkLogDeleted(supabase, {
        employeeId: existing.employee_id as string,
        projectId,
        workLogId: existing.id as string,
        date: existing.date as string,
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
