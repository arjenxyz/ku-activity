import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { getProjectClosureSummary } from '@/lib/project-closure-service';
import { isProjectInClosure } from '@/lib/closure-phase';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    await requireAdminProjectAccess(projectId);

    const summary = await getProjectClosureSummary(projectId);
    const admin = createAdminClient();
    const { data: project } = await admin.from('projects').select('name').eq('id', projectId).maybeSingle();

    return NextResponse.json({
      ...summary,
      inClosure: isProjectInClosure(summary.phase),
      projectName: project?.name ?? undefined,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
