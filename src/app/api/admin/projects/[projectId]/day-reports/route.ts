import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/day-reports/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const status = new URL(request.url).searchParams.get('status') ?? 'open';

    const supabase = await createClient();
    let q = supabase
      .from('day_error_reports')
      .select('id, employee_id, work_date, categories, note, status, created_at, resolved_at, employees(name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (status === 'open' || status === 'resolved') {
      q = q.eq('status', status);
    }

    const { data, error } = await q;
    if (error) {
      if (error.message.includes('day_error_reports')) {
        return NextResponse.json({ reports: [], note: '077_day_error_reports.sql çalıştırın' });
      }
      return NextResponse.json({ error: strings.loadFailed }, { status: 500 });
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
