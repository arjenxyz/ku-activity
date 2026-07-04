import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { AdvanceRequestError, confirmCashAdvance } from '@/lib/advance-request-service';
import { normalizeAdvanceCashToken } from '@/lib/advance-cash-token';
import strings from '@json/src/app/api/personnel/advance-requests/confirm-cash/route.json';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json();
    const token = normalizeAdvanceCashToken(String(body.token ?? ''));
    if (!token) {
      return NextResponse.json({ error: strings.geçerliBirAvnKoduGirin }, { status: 400 });
    }

    const admin = createAdminClient();
    const record = await confirmCashAdvance(admin, {
      token,
      employeeId: session.employeeId,
    });

    return NextResponse.json({ request: record });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.oturumGeçersiz }, { status: 401 });
    }
    return NextResponse.json({ error: strings.onayKaydedilemedi }, { status: 500 });
  }
}
