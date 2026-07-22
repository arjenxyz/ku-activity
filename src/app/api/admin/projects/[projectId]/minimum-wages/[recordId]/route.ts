import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import {
  notifyMinimumWageRemoved,
  notifyMinimumWageUpdated,
} from '@/lib/personnel-notification-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/minimum-wages/[recordId]/route.json';

type Ctx = { params: Promise<{ projectId: string; recordId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, recordId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { date, amount, description } = body as {
      date?: string;
      amount?: number;
      description?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (date !== undefined) updates.date = date;
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description || null;

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: strings.güncellenecekAlanYok }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('minimum_wages')
      .update(updates)
      .eq('id', recordId)
      .eq('project_id', projectId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: strings.kayıtBulunamadı }, { status: 404 });

    try {
      await notifyMinimumWageUpdated(supabase, {
        employeeId: data.employee_id as string,
        projectId,
        amount: Number(data.amount),
        date: data.date as string,
        recordId: data.id as string,
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
      .from('minimum_wages')
      .select('id, employee_id, amount, date')
      .eq('id', recordId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: strings.kayıtBulunamadı }, { status: 404 });

    const { error } = await supabase
      .from('minimum_wages')
      .delete()
      .eq('id', recordId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      await notifyMinimumWageRemoved(supabase, {
        employeeId: existing.employee_id as string,
        projectId,
        amount: Number(existing.amount),
        date: existing.date as string,
        recordId: existing.id as string,
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
