import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { notifyPersonnel } from '@/lib/personnel-notification-service';
import {
  dispatchPersonnelPush,
  getVapidDiagnostics,
  isVapidEnabled,
  listEmployeePushSubscriptions,
} from '@/lib/personnel-push-service';

async function runPushTest() {
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

  const vapidDiagnostics = getVapidDiagnostics();
  const subscriptionsBefore = await listEmployeePushSubscriptions(admin, session.employeeId);
  const pushResult = vapidDiagnostics.keyPairValid
    ? await dispatchPersonnelPush(admin, {
        employeeId: session.employeeId,
        notificationId: row.id,
        title: row.title,
        body: row.body,
        href: row.href ?? '/personnel-panel',
      })
    : {
        sent: 0,
        skipped: true,
        keyPairValid: false,
        errors: [
          {
            message:
              'VAPID public/private key uyumsuz — Vercel env’de aynı generate-vapid-keys çiftini kullanın',
          },
        ],
      };

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
    vapidDiagnostics,
    subscriptionCount: subscriptionsBefore.length,
    hint: (() => {
      if (pushResult.sent > 0) {
        return 'Telefonda bildirim gelmeli. push_sent_at doluysa sunucu tarafı çalışıyor.';
      }
      if (pushResult.keyPairValid === false) {
        return 'VAPID public/private key uyumsuz — Vercel env düzeltin, redeploy, personel panelde bildirim iznini yenileyin.';
      }
      if (pushResult.errors?.length) {
        return `Push hatası: ${pushResult.errors[0].message}. Bildirim iznini kapat-aç deneyin.`;
      }
      if (subscriptionsBefore.length === 0) {
        return 'Kayıtlı cihaz yok — önce personel paneli açıp “Bildirimleri aç” deyin, sonra bu sayfayı yenileyin.';
      }
      return 'push_sent_at boş — cihaz push reddetti; bildirim iznini kapat-aç deneyin.';
    })(),
  });
}

async function handleRequest() {
  try {
    return await runPushTest();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Test bildirimi gönderilemedi';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        {
          error: 'Personel oturumu gerekli',
          hint: 'Önce /personnel-panel/login adresinden giriş yapın, ardından bu sayfayı yenileyin.',
        },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Tarayıcıdan açılabilir — personel oturumu ile test push gönderir. */
export async function GET() {
  return handleRequest();
}

export async function POST() {
  return handleRequest();
}
