import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { AdvanceRequestError, cancelAdvanceRequest } from '@/lib/advance-request-service';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const session = await requirePersonnelSession();
    const { id } = await ctx.params;
    const admin = createAdminClient();
    const record = await cancelAdvanceRequest(admin, {
      requestId: id,
      employeeId: session.employeeId,
    });
    return NextResponse.json({ request: record });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
    }
    return NextResponse.json({ error: 'İptal başarısız' }, { status: 500 });
  }
}
