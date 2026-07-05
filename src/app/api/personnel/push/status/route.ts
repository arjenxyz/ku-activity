import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  isVapidEnabled,
  listEmployeePushSubscriptions,
  maskPushEndpoint,
} from '@/lib/personnel-push-service';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const [subscriptions, notificationsResult] = await Promise.all([
      listEmployeePushSubscriptions(admin, session.employeeId),
      admin
        .from('personnel_notifications')
        .select('id, type, title, push_sent_at, created_at')
        .eq('employee_id', session.employeeId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const recentNotifications =
      notificationsResult.error?.message.includes('personnel_notifications')
        ? []
        : (notificationsResult.data ?? []);

    return NextResponse.json({
      vapidEnabled: isVapidEnabled(),
      subscriptionCount: subscriptions.length,
      subscribed: subscriptions.length > 0,
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        endpoint: maskPushEndpoint(sub.endpoint as string),
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
        deviceRegistered: subscriptions.length > 0,
        pushDeliveredRecently: recentNotifications.some((row) => row.push_sent_at != null),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Push durumu alınamadı';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
