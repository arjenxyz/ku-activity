import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
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

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('minimum_wages')
      .update(updates)
      .eq('id', recordId)
      .eq('project_id', projectId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: strings.kayıtBulunamadı }, { status: 404 });

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
    const supabase = await createClient();
    const { error } = await supabase
      .from('minimum_wages')
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
