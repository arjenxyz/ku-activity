import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { markAllPersonnelNotificationsRead } from '@/lib/personnel-notification-service';
import { personnelApiErrorResponse } from '@/lib/safe-api-error';

export async function POST() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();
    await markAllPersonnelNotificationsRead(admin, session.employeeId);
    return NextResponse.json({ ok: true, unreadCount: 0 });
  } catch (e) {
    return personnelApiErrorResponse(e, 'Güncellenemedi');
  }
}
