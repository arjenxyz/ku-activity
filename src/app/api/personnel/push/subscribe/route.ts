import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  removePushSubscription,
  upsertPushSubscription,
} from '@/lib/personnel-push-service';
import { parsePushEndpoint, parsePushSubscription } from '@/lib/api-validation';
import { personnelApiErrorResponse } from '@/lib/safe-api-error';
import strings from '@json/src/app/api/personnel/push/subscribe/route.json';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => null);
    const subscription = parsePushSubscription(body);

    if (!subscription) {
      return NextResponse.json({ error: strings.invalidSubscription }, { status: 400 });
    }

    const admin = createAdminClient();
    await upsertPushSubscription(admin, {
      employeeId: session.employeeId,
      sessionId: session.sessionId,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? undefined,
    });

    return NextResponse.json({ ok: true, sessionId: session.sessionId });
  } catch (e) {
    return personnelApiErrorResponse(e, strings.saveFailed);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => null);
    const endpoint = parsePushEndpoint(body);

    if (!endpoint) {
      return NextResponse.json({ error: strings.endpointRequired }, { status: 400 });
    }

    const admin = createAdminClient();
    await removePushSubscription(admin, session.employeeId, endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return personnelApiErrorResponse(e, strings.deleteFailed);
  }
}
