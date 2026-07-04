import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const status = new URL(request.url).searchParams.get('status');

    const supabase = await createClient();
    let q = supabase
      .from('advance_requests')
      .select(
        '*, employees(name)'
      )
      .eq('project_id', projectId)
      .order('requested_at', { ascending: false })
      .limit(200);

    if (status) q = q.eq('status', status);

    const { data, error } = await q;
    if (error) {
      if (error.message.includes('advance_requests')) {
        return NextResponse.json({ requests: [], note: '056_advance_requests.sql çalıştırın' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
