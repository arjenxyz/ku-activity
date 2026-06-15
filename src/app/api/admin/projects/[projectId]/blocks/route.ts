import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createProjectBlock, listProjectBlocks } from '@/lib/block-team-service';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    const blocks = await listProjectBlocks(admin, projectId);
    return NextResponse.json({ blocks });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { name, notes } = body as { name?: string; notes?: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Blok adı zorunlu' }, { status: 400 });
    }

    const admin = createAdminClient();
    const block = await createProjectBlock(admin, projectId, { name, notes });
    return NextResponse.json({ block }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
