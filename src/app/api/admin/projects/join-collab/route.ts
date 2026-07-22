import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { joinProjectWithCollabCode } from '@/lib/project-collaborators';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/join-collab/route.json';

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code : '';

    const result = await joinProjectWithCollabCode({
      userId: user.id,
      code,
    });

    return NextResponse.json({
      ok: true,
      projectId: result.projectId,
      projectName: result.projectName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.joinFailed;
    if (message === 'INVALID_CODE') {
      return NextResponse.json({ error: strings.invalidCode }, { status: 400 });
    }
    if (message === 'CODE_NOT_FOUND') {
      return NextResponse.json({ error: strings.codeNotFound }, { status: 404 });
    }
    if (message === 'ALREADY_OWNER') {
      return NextResponse.json({ error: strings.alreadyOwner }, { status: 409 });
    }
    if (message === 'ALREADY_COLLABORATOR') {
      return NextResponse.json({ error: strings.alreadyCollaborator }, { status: 409 });
    }
    if (message === 'MIGRATION_REQUIRED') {
      return NextResponse.json({ error: strings.migrationRequired }, { status: 503 });
    }
    const { status, message: apiMsg } = apiErrorMessage(err);
    return NextResponse.json({ error: apiMsg }, { status });
  }
}
