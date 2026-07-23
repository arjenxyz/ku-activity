import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  countUnreadPersonnelNotifications,
  deletePersonnelNotification,
  listPersonnelNotifications,
  markPersonnelNotificationRead,
} from '@/lib/personnel-notification-service';
import { personnelApiErrorResponse } from '@/lib/safe-api-error';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const [items, unreadCount] = await Promise.all([
      listPersonnelNotifications(admin, session.employeeId, 100),
      countUnreadPersonnelNotifications(admin, session.employeeId),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (e) {
    return personnelApiErrorResponse(e, 'Bildirimler yüklenemedi');
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const notificationId = typeof body.id === 'string' ? body.id : '';

    if (!notificationId) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }

    const admin = createAdminClient();
    await markPersonnelNotificationRead(admin, session.employeeId, notificationId);
    const unreadCount = await countUnreadPersonnelNotifications(admin, session.employeeId);

    return NextResponse.json({ ok: true, unreadCount });
  } catch (e) {
    return personnelApiErrorResponse(e, 'Güncellenemedi');
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const notificationId = typeof body.id === 'string' ? body.id : '';

    if (!notificationId) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }

    const admin = createAdminClient();
    await deletePersonnelNotification(admin, session.employeeId, notificationId);
    const unreadCount = await countUnreadPersonnelNotifications(admin, session.employeeId);

    return NextResponse.json({ ok: true, unreadCount });
  } catch (e) {
    return personnelApiErrorResponse(e, 'Silinemedi');
  }
}
