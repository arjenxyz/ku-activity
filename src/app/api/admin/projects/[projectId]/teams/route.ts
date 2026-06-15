import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createProjectTeam, listProjectTeams } from '@/lib/block-team-service';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    const teams = await listProjectTeams(admin, projectId);
    return NextResponse.json({ teams });
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
    const { name, blockId, currentJobId } = body as {
      name?: string;
      blockId?: string | null;
      currentJobId?: string | null;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Ekip adı zorunlu' }, { status: 400 });
    }

    const admin = createAdminClient();
    const team = await createProjectTeam(admin, projectId, { name, blockId, currentJobId });
    const teams = await listProjectTeams(admin, projectId);
    return NextResponse.json({ team, teams }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
