import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { mesaiTypeToUnits, type MesaiType } from '@/lib/work-log';

type Ctx = { params: Promise<{ projectId: string; recordId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, recordId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { date, amount, description, mesaiType, reconfirmAdmin, resolveDispute } = body as {
      date?: string;
      amount?: number;
      description?: string | null;
      mesaiType?: MesaiType;
      reconfirmAdmin?: boolean;
      resolveDispute?: boolean;
    };

    const updates: Record<string, unknown> = {};
    if (date !== undefined) updates.date = date;
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description || null;
    if (mesaiType !== undefined) {
      updates.mesai_type = mesaiType;
      updates.mesai_units = mesaiTypeToUnits(mesaiType);
    }
    if (reconfirmAdmin) {
      updates.admin_confirmed_at = new Date().toISOString();
      updates.approved_by = user.id;
    }
    if (resolveDispute) {
      updates.employee_dispute_note = null;
      updates.employee_disputed_at = null;
      updates.employee_confirmed_at = null;
      updates.admin_confirmed_at = new Date().toISOString();
      updates.approved_by = user.id;
      updates.approved = false;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
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
        return NextResponse.json({ error: 'Bu tarih için zaten yevmiye kaydı var' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });

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
    const { error } = await supabase
      .from('work_logs')
      .delete()
      .eq('id', recordId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
