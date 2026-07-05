import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  removePushSubscription,
  upsertPushSubscription,
} from '@/lib/personnel-push-service';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));

    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
    const p256dh = typeof body.p256dh === 'string' ? body.p256dh : '';
    const auth = typeof body.auth === 'string' ? body.auth : '';

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Geçersiz abonelik' }, { status: 400 });
    }

    const admin = createAdminClient();
    await upsertPushSubscription(admin, {
      employeeId: session.employeeId,
      sessionId: session.sessionId,
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ ok: true, sessionId: session.sessionId });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Abonelik kaydedilemedi';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint gerekli' }, { status: 400 });
    }

    const admin = createAdminClient();
    await removePushSubscription(admin, session.employeeId, endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Abonelik silinemedi';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
