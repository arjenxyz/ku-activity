import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { deleteProjectTeam, listProjectTeams, updateProjectTeam } from '@/lib/block-team-service';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; teamId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, teamId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { name, blockId, currentJobId } = body as {
      name?: string;
      blockId?: string | null;
      currentJobId?: string | null;
    };

    const admin = createAdminClient();
    await updateProjectTeam(admin, projectId, teamId, { name, blockId, currentJobId });
    const teams = await listProjectTeams(admin, projectId);
    return NextResponse.json({ teams });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, teamId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    await deleteProjectTeam(admin, projectId, teamId);
    const teams = await listProjectTeams(admin, projectId);
    return NextResponse.json({ teams });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
