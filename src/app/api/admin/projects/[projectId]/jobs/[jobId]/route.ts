import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { loadProjectProfitOverview } from '@/lib/job-profit-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/jobs/[jobId]/route.json';

type Ctx = { params: Promise<{ projectId: string; jobId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, jobId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { name, unitLabel, unitPrice, quantity, status, notes } = body as {
      name?: string;
      unitLabel?: string;
      unitPrice?: number;
      quantity?: number;
      status?: 'active' | 'completed';
      notes?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (unitLabel !== undefined) updates.unit_label = unitLabel.trim().slice(0, 32) || 'm²';
    if (unitPrice !== undefined) updates.unit_price = unitPrice;
    if (quantity !== undefined) updates.quantity = quantity;
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    if (status !== undefined) {
      updates.status = status;
      updates.completed_at = status === 'completed' ? new Date().toISOString() : null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: strings.güncellenecekAlanYok }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('project_jobs')
      .update(updates)
      .eq('id', jobId)
      .eq('project_id', projectId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: strings.i̇şKalemiBulunamadı }, { status: 404 });

    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json({ job: data, overview });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, jobId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    const { error } = await admin
      .from('project_jobs')
      .delete()
      .eq('id', jobId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json({ success: true, overview });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
