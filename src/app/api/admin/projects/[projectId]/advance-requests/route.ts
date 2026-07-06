import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  AdvanceRequestError,
  createAdvanceRequestOnBehalf,
} from '@/lib/advance-request-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/advance-requests/route.json';

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

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const actor = await requireAdminProjectAccess(projectId);
    const body = await request.json();

    const employeeId = typeof body.employeeId === 'string' ? body.employeeId : '';
    const amount = Number(body.amount);
    if (!employeeId) {
      return NextResponse.json({ error: strings.employeeRequired }, { status: 400 });
    }

    const admin = createAdminClient();
    const record = await createAdvanceRequestOnBehalf(admin, {
      projectId,
      employeeId,
      amount,
      note: typeof body.note === 'string' ? body.note : undefined,
      adminNote: typeof body.adminNote === 'string' ? body.adminNote : undefined,
      actor,
    });

    return NextResponse.json({ request: record }, { status: 201 });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
