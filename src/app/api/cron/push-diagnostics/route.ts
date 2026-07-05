import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { dispatchPersonnelPush, getVapidDiagnostics, isVapidEnabled } from '@/lib/personnel-push-service';
import { notifyPersonnel } from '@/lib/personnel-notification-service';
import strings from '@json/src/lib/personnel-notifications.json';

export const dynamic = 'force-dynamic';

async function loadDiagnostics(admin: ReturnType<typeof createAdminClient>) {
  const [subsResult, recentNotifsResult] = await Promise.all([
    admin
      .from('personnel_push_subscriptions')
      .select('id, employee_id, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(5),
    admin
      .from('personnel_notifications')
      .select('id, type, push_sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const subscriptionsMissing = subsResult.error?.message.includes('personnel_push_subscriptions');
  const notificationsMissing = recentNotifsResult.error?.message.includes('personnel_notifications');

  const recentNotifications = notificationsMissing ? [] : (recentNotifsResult.data ?? []);
  const withPush = recentNotifications.filter((row) => row.push_sent_at != null);
  const withoutPush = recentNotifications.filter((row) => row.push_sent_at == null);

  return {
    vapidEnabled: isVapidEnabled(),
    vapidDiagnostics: getVapidDiagnostics(),
    subscriptions: {
      tableReady: !subscriptionsMissing,
      total: subscriptionsMissing ? 0 : (subsResult.count ?? 0),
      recent: subscriptionsMissing
        ? []
        : (subsResult.data ?? []).map((row) => ({
            employeeId: row.employee_id,
            updatedAt: row.updated_at,
          })),
    },
    notifications: {
      tableReady: !notificationsMissing,
      recentSample: recentNotifications.map((row) => ({
        id: row.id,
        type: row.type,
        pushSentAt: row.push_sent_at,
        createdAt: row.created_at,
      })),
      recentWithPushSent: withPush.length,
      recentWithoutPushSent: withoutPush.length,
    },
    checklist: {
      vapidConfigured: getVapidDiagnostics().configured,
      vapidKeyPairValid: getVapidDiagnostics().keyPairValid,
      hasSubscriptions: !subscriptionsMissing && (subsResult.count ?? 0) > 0,
      pushSentRecently: withPush.length > 0,
    },
  };
}

/**
 * VAPID / push zinciri doğrulama — cron-job.org veya operatör tarafından.
 * Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const admin = createAdminClient();
  const diagnostics = await loadDiagnostics(admin);

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    ...diagnostics,
  });
}

/** Kayıtlı son cihaza test push gönder (uçtan uca doğrulama). */
export async function POST(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  if (!isVapidEnabled()) {
    return NextResponse.json({ error: 'VAPID yapılandırılmamış' }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: sub, error: subError } = await admin
    .from('personnel_push_subscriptions')
    .select('employee_id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError?.message.includes('personnel_push_subscriptions')) {
    return NextResponse.json({ error: 'Abonelik tablosu yok' }, { status: 503 });
  }
  if (!sub?.employee_id) {
    return NextResponse.json({ error: 'Kayıtlı push aboneliği yok' }, { status: 404 });
  }

  const { data: employee, error: employeeError } = await admin
    .from('employees')
    .select('project_id')
    .eq('id', sub.employee_id)
    .maybeSingle();

  if (employeeError || !employee?.project_id) {
    return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
  }

  const row = await notifyPersonnel(admin, {
    employeeId: sub.employee_id as string,
    projectId: employee.project_id as string,
    type: 'general',
    title: strings.pushTest.title,
    body: strings.pushTest.body,
    href: '/personnel-panel',
    sendPush: false,
  });

  if (!row) {
    return NextResponse.json({ error: 'Bildirim oluşturulamadı' }, { status: 503 });
  }

  const pushResult = await dispatchPersonnelPush(admin, {
    employeeId: sub.employee_id as string,
    notificationId: row.id,
    title: row.title,
    body: row.body,
    href: row.href ?? '/personnel-panel',
  });

  const { data: updated } = await admin
    .from('personnel_notifications')
    .select('push_sent_at')
    .eq('id', row.id)
    .single();

  const diagnostics = await loadDiagnostics(admin);

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    test: {
      notificationId: row.id,
      employeeId: sub.employee_id,
      pushSentAt: updated?.push_sent_at ?? null,
      push: pushResult,
    },
    ...diagnostics,
  });
}
