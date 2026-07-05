import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  isVapidEnabled,
  listActiveEmployeePushSubscriptions,
  listEmployeePushSubscriptions,
  maskPushEndpoint,
  getVapidDiagnostics,
  touchPushSubscriptionLastSeen,
} from '@/lib/personnel-push-service';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    await touchPushSubscriptionLastSeen(admin, session.sessionId).catch(() => undefined);

    const [allSubscriptions, activeSubscriptions, notificationsResult] = await Promise.all([
      listEmployeePushSubscriptions(admin, session.employeeId),
      listActiveEmployeePushSubscriptions(admin, session.employeeId),
      admin
        .from('personnel_notifications')
        .select('id, type, title, push_sent_at, created_at')
        .eq('employee_id', session.employeeId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const currentSessionSubscribed = activeSubscriptions.some(
      (sub) => sub.session_id === session.sessionId
    );

    const recentNotifications =
      notificationsResult.error?.message.includes('personnel_notifications')
        ? []
        : (notificationsResult.data ?? []);

    return NextResponse.json({
      vapidEnabled: isVapidEnabled(),
      vapidDiagnostics: getVapidDiagnostics(),
      sessionId: session.sessionId,
      subscriptionCount: activeSubscriptions.length,
      subscribed: activeSubscriptions.length > 0,
      currentSessionSubscribed,
      subscriptions: allSubscriptions.map((sub) => ({
        id: sub.id,
        endpoint: maskPushEndpoint(sub.endpoint as string),
        sessionId: sub.session_id ?? null,
        isCurrentSession: sub.session_id === session.sessionId,
        isActiveSession: activeSubscriptions.some((active) => active.id === sub.id),
        lastSeenAt: sub.last_seen_at ?? null,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        userAgent: sub.user_agent ?? null,
      })),
      recentNotifications: recentNotifications.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        pushSentAt: row.push_sent_at,
        createdAt: row.created_at,
      })),
      checklist: {
        vapidConfigured: isVapidEnabled(),
        deviceRegistered: currentSessionSubscribed,
        activeDeviceCount: activeSubscriptions.length,
        pushDeliveredRecently: recentNotifications.some((row) => row.push_sent_at != null),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Push durumu alınamadı';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
