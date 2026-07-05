import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { notifyPersonnel } from '@/lib/personnel-notification-service';
import { dispatchPersonnelPush, isVapidEnabled } from '@/lib/personnel-push-service';

export async function POST() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const row = await notifyPersonnel(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      type: 'general',
      title: 'CrewLedger test bildirimi',
      body: 'Push bildirimleri çalışıyor. Bu mesajı görüyorsanız VAPID zinciri doğru kurulmuş.',
      href: '/personnel-panel',
      sendPush: false,
    });

    if (!row) {
      return NextResponse.json(
        { error: 'Bildirim oluşturulamadı (tablo eksik olabilir)' },
        { status: 503 }
      );
    }

    const pushResult = isVapidEnabled()
      ? await dispatchPersonnelPush(admin, {
          employeeId: session.employeeId,
          notificationId: row.id,
          title: row.title,
          body: row.body,
          href: row.href ?? '/personnel-panel',
        })
      : { sent: 0, skipped: true };

    const { data: updated } = await admin
      .from('personnel_notifications')
      .select('push_sent_at')
      .eq('id', row.id)
      .single();

    return NextResponse.json({
      ok: true,
      notificationId: row.id,
      pushSentAt: updated?.push_sent_at ?? null,
      push: pushResult,
      vapidEnabled: isVapidEnabled(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Test bildirimi gönderilemedi';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
