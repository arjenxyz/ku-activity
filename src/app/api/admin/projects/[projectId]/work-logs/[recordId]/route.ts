import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; recordId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { projectId, recordId } = await ctx.params;
    const body = await request.json();
    const { date, amount, description, approved } = body as {
      date?: string;
      amount?: number;
      description?: string | null;
      approved?: boolean;
    };

    const updates: Record<string, unknown> = {};
    if (date !== undefined) updates.date = date;
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description || null;
    if (approved !== undefined) {
      updates.approved = approved;
      updates.approved_at = approved ? new Date().toISOString() : null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
    }

    const supabase = await createClient();
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
    await requireAdminUser();
    const { projectId, recordId } = await ctx.params;
    const supabase = await createClient();
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
