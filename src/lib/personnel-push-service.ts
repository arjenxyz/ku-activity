import 'server-only';
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';

type PushPayload = {
  employeeId: string;
  notificationId: string;
  title: string;
  body: string;
  href: string;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@crewledger.app';

  if (!publicKey || !privateKey) return null;

  return { publicKey, privateKey, subject };
}

export function getPublicVapidKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? null;
}

export function isVapidEnabled() {
  return getVapidConfig() !== null;
}

export function maskPushEndpoint(endpoint: string) {
  if (endpoint.length <= 24) return endpoint;
  return `${endpoint.slice(0, 20)}…${endpoint.slice(-8)}`;
}

export async function listEmployeePushSubscriptions(
  admin: SupabaseClient,
  employeeId: string
) {
  const { data, error } = await admin
    .from('personnel_push_subscriptions')
    .select('id, endpoint, created_at, updated_at, user_agent')
    .eq('employee_id', employeeId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (error.message.includes('personnel_push_subscriptions')) return [];
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function upsertPushSubscription(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }
) {
  const { error } = await admin.from('personnel_push_subscriptions').upsert(
    {
      employee_id: params.employeeId,
      endpoint: params.endpoint,
      p256dh: params.p256dh,
      auth: params.auth,
      user_agent: params.userAgent ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'employee_id,endpoint' }
  );

  if (error) throw new Error(error.message);
}

export async function removePushSubscription(
  admin: SupabaseClient,
  employeeId: string,
  endpoint: string
) {
  const { error } = await admin
    .from('personnel_push_subscriptions')
    .delete()
    .eq('employee_id', employeeId)
    .eq('endpoint', endpoint);

  if (error) throw new Error(error.message);
}

export async function dispatchPersonnelPush(admin: SupabaseClient, payload: PushPayload) {
  const vapid = getVapidConfig();
  if (!vapid) return { sent: 0, skipped: true };

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const { data: subs, error } = await admin
    .from('personnel_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('employee_id', payload.employeeId);

  if (error) {
    if (error.message.includes('personnel_push_subscriptions')) return { sent: 0, skipped: true };
    throw new Error(error.message);
  }

  if (!subs?.length) return { sent: 0, skipped: false };

  const pushBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href,
    notificationId: payload.notificationId,
  });

  let sent = 0;
  const staleIds: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint as string,
          keys: {
            p256dh: sub.p256dh as string,
            auth: sub.auth as string,
          },
        },
        pushBody
      );
      sent += 1;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        staleIds.push(sub.id as string);
      }
    }
  }

  if (staleIds.length) {
    await admin.from('personnel_push_subscriptions').delete().in('id', staleIds);
  }

  if (sent > 0) {
    await admin
      .from('personnel_notifications')
      .update({ push_sent_at: new Date().toISOString() })
      .eq('id', payload.notificationId);
  }

  return { sent, skipped: false };
}
