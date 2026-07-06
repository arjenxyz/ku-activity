import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { deleteAllPersonnelNotifications } from '@/lib/personnel-notification-service';

export async function POST() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();
    await deleteAllPersonnelNotifications(admin, session.employeeId);
    return NextResponse.json({ ok: true, unreadCount: 0 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Silinemedi';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
