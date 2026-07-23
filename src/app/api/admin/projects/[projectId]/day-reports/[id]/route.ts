import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/day-reports/[id]/route.json';

type Ctx = { params: Promise<{ projectId: string; id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, id } = await ctx.params;
    const actor = await requireAdminProjectAccess(projectId);
    const body = await request.json().catch(() => null);
    const status = body && typeof body === 'object' ? (body as { status?: unknown }).status : null;

    if (status !== 'resolved') {
      return NextResponse.json({ error: strings.invalidStatus }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('day_error_reports')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: actor.id,
      })
      .eq('id', id)
      .eq('project_id', projectId)
      .eq('status', 'open')
      .select('id, status, resolved_at')
      .maybeSingle();

    if (error) {
      if (error.message.includes('day_error_reports')) {
        return NextResponse.json({ error: strings.migrationRequired }, { status: 503 });
      }
      return NextResponse.json({ error: strings.resolveFailed }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: strings.notFound }, { status: 404 });
    }

    return NextResponse.json({ report: data });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
