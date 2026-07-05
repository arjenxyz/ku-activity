import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { revokePersonnelSessionById } from '@/lib/personnel-session-service';
import { PERSONNEL_COOKIE, personnelCookieOptions } from '@/lib/personnel-session';

type Ctx = { params: Promise<{ sessionId: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const session = await requirePersonnelSession();
    const { sessionId } = await ctx.params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Geçersiz oturum' }, { status: 400 });
    }

    const admin = createAdminClient();
    const revoked = await revokePersonnelSessionById(admin, {
      employeeId: session.employeeId,
      sessionId,
    });

    if (!revoked) {
      return NextResponse.json({ error: 'Cihaz bulunamadı veya zaten kaldırılmış' }, { status: 404 });
    }

    const isCurrent = sessionId === session.sessionId;
    const response = NextResponse.json({ ok: true, isCurrent });

    if (isCurrent) {
      const cookieStore = await cookies();
      response.cookies.set(PERSONNEL_COOKIE, '', {
        ...personnelCookieOptions(new Date(0)),
        maxAge: 0,
      });
      cookieStore.set(PERSONNEL_COOKIE, '', { ...personnelCookieOptions(new Date(0)), maxAge: 0 });
    }

    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Cihaz kaldırılamadı';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
