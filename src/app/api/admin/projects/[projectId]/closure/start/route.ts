import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import {
  getProjectClosureSummary,
  startProjectClosure,
} from '@/lib/project-closure-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/closure/start/route.json';
import serviceStrings from '@json/src/lib/project-closure-service.json';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const summary = await getProjectClosureSummary(projectId);
    return NextResponse.json(summary);
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);

    const result = await startProjectClosure({
      projectId,
      startedByEmail: user.email ?? null,
    });

    return NextResponse.json({
      ok: true,
      message: strings.started,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.failed;
    if (message === 'PROJECT_NOT_FOUND') {
      return NextResponse.json({ error: serviceStrings.errors.projectNotFound }, { status: 404 });
    }
    if (message === 'ALREADY_IN_CLOSURE') {
      return NextResponse.json({ error: serviceStrings.errors.alreadyInClosure }, { status: 409 });
    }
    if (message === 'ALREADY_PURGED') {
      return NextResponse.json({ error: serviceStrings.errors.alreadyPurged }, { status: 409 });
    }
    return NextResponse.json({ error: strings.failed }, { status: 400 });
  }
}
