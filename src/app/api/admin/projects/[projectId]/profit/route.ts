import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { loadProjectProfitOverview } from '@/lib/job-profit-service';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json(overview);
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { shareCount } = body as { shareCount?: number };

    if (shareCount == null || !Number.isFinite(shareCount)) {
      return NextResponse.json({ error: 'shareCount zorunlu' }, { status: 400 });
    }

    const admin = createAdminClient();
    const count = Math.max(1, Math.min(20, Math.floor(shareCount)));
    const { data, error } = await admin
      .from('project_profit_settings')
      .upsert({ project_id: projectId, share_count: count }, { onConflict: 'project_id' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json({ settings: data, overview });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
