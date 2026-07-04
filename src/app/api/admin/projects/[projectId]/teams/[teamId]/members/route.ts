import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { addTeamMember, listProjectTeams, removeTeamMember } from '@/lib/block-team-service';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/teams/[teamId]/members/route.json';

type Ctx = { params: Promise<{ projectId: string; teamId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, teamId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { employeeId } = body as { employeeId?: string };

    if (!employeeId) {
      return NextResponse.json({ error: strings.personelSeçimiZorunlu }, { status: 400 });
    }

    const admin = createAdminClient();
    await addTeamMember(admin, projectId, teamId, employeeId);
    const teams = await listProjectTeams(admin, projectId);
    return NextResponse.json({ teams }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  try {
    const { projectId, teamId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: strings.memberidZorunlu }, { status: 400 });
    }

    const admin = createAdminClient();
    await removeTeamMember(admin, teamId, memberId);
    const teams = await listProjectTeams(admin, projectId);
    return NextResponse.json({ teams });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
