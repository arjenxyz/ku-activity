import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { loadProjectProfitOverview } from '@/lib/job-profit-service';

type Ctx = { params: Promise<{ projectId: string; jobId: string; expenseId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, jobId, expenseId } = await ctx.params;
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
    if (description !== undefined) updates.description = description?.trim() || null;

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('project_job_expenses')
      .update(updates)
      .eq('id', expenseId)
      .eq('job_id', jobId)
      .eq('project_id', projectId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Gider bulunamadı' }, { status: 404 });

    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json({ expense: data, overview });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, jobId, expenseId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    const { error } = await admin
      .from('project_job_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('job_id', jobId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json({ success: true, overview });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
