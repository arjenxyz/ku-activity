import 'server-only';
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vapidKeyPairMatches } from '@/lib/vapid-keys';

type PushPayload = {
  employeeId: string;
  notificationId: string;
  title: string;
  body: string;
  href: string;
};

type PushDispatchError = {
  statusCode?: number;
  message: string;
};

export type PushDispatchResult = {
  sent: number;
  skipped: boolean;
  keyPairValid?: boolean;
  targetCount?: number;
  errors?: PushDispatchError[];
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@crewledger.app';

  if (!publicKey || !privateKey) return null;

  const keyPairValid = vapidKeyPairMatches(publicKey, privateKey);

  return { publicKey, privateKey, subject, keyPairValid };
}

export function getPublicVapidKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? null;
}

export function isVapidEnabled() {
  const config = getVapidConfig();
  return config !== null && config.keyPairValid;
}

export function getVapidDiagnostics() {
  const publicKey = getPublicVapidKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) {
    return { configured: false, keyPairValid: false, publicKey: null as string | null };
  }
  return {
    configured: true,
    keyPairValid: vapidKeyPairMatches(publicKey, privateKey),
    publicKey,
  };
}

export function maskPushEndpoint(endpoint: string) {
  if (endpoint.length <= 24) return endpoint;
  return `${endpoint.slice(0, 20)}…${endpoint.slice(-8)}`;
}

function isMissingPushTable(message: string) {
  return message.includes('personnel_push_subscriptions');
}

async function loadActiveSessionIds(admin: SupabaseClient, sessionIds: string[]) {
  if (!sessionIds.length) return new Set<string>();

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('personnel_sessions')
    .select('id')
    .in('id', sessionIds)
    .is('revoked_at', null)
    .gt('expires_at', now);

  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row) => row.id as string));
}

export async function listEmployeePushSubscriptions(
  admin: SupabaseClient,
  employeeId: string
) {
  const { data, error } = await admin
    .from('personnel_push_subscriptions')
    .select('id, endpoint, created_at, updated_at, user_agent, session_id, last_seen_at')
    .eq('employee_id', employeeId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingPushTable(error.message)) return [];
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listActiveEmployeePushSubscriptions(
  admin: SupabaseClient,
  employeeId: string
) {
  const { data, error } = await admin
    .from('personnel_push_subscriptions')
    .select('id, endpoint, p256dh, auth, session_id, last_seen_at, created_at, updated_at, user_agent')
    .eq('employee_id', employeeId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingPushTable(error.message)) return [];
    throw new Error(error.message);
  }

  const subs = data ?? [];
  if (!subs.length) return [];

  const sessionIds = subs
    .map((sub) => sub.session_id as string | null)
    .filter((id): id is string => Boolean(id));

  const activeSessionIds = await loadActiveSessionIds(admin, sessionIds);

  const active = subs.filter(
    (sub) => sub.session_id && activeSessionIds.has(sub.session_id as string)
  );
  if (active.length) return active;

  // Oturum eşleşmesi yoksa bile son 30 gün içinde güncellenen aboneliklere gönder
  // (FCM endpoint geçerliyken kapalı uygulama teslimatı için)
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return subs.filter((sub) => {
    const seen = sub.last_seen_at ?? sub.updated_at ?? sub.created_at;
    if (!seen) return false;
    return new Date(seen as string).getTime() >= cutoff;
  });
}

/** Oturumu sona ermiş veya bağsız (legacy) abonelikleri temizle */
export async function pruneInactivePushSubscriptions(
  admin: SupabaseClient,
  employeeId: string
) {
  const subs = await listEmployeePushSubscriptions(admin, employeeId);
  if (!subs.length) return;

  const sessionIds = subs
    .map((sub) => sub.session_id as string | null)
    .filter((id): id is string => Boolean(id));

  const activeSessionIds = await loadActiveSessionIds(admin, sessionIds);
  const staleIds = subs
    .filter((sub) => !sub.session_id || !activeSessionIds.has(sub.session_id as string))
    .map((sub) => sub.id as string);

  if (!staleIds.length) return;

  const { error } = await admin.from('personnel_push_subscriptions').delete().in('id', staleIds);
  if (error && !isMissingPushTable(error.message)) throw new Error(error.message);
}

export async function upsertPushSubscription(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    sessionId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }
) {
  const now = new Date().toISOString();

  const { error: clearSessionError } = await admin
    .from('personnel_push_subscriptions')
    .delete()
    .eq('session_id', params.sessionId);

  if (clearSessionError && !isMissingPushTable(clearSessionError.message)) {
    throw new Error(clearSessionError.message);
  }

  const { error } = await admin.from('personnel_push_subscriptions').upsert(
    {
      employee_id: params.employeeId,
      session_id: params.sessionId,
      endpoint: params.endpoint,
      p256dh: params.p256dh,
      auth: params.auth,
      user_agent: params.userAgent ?? null,
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: 'employee_id,endpoint' }
  );

  if (error) throw new Error(error.message);

  await pruneInactivePushSubscriptions(admin, params.employeeId);
}

export async function touchPushSubscriptionLastSeen(
  admin: SupabaseClient,
  sessionId: string
) {
  const now = new Date().toISOString();
  const { error } = await admin
    .from('personnel_push_subscriptions')
    .update({ last_seen_at: now, updated_at: now })
    .eq('session_id', sessionId);

  if (error && !isMissingPushTable(error.message)) throw new Error(error.message);
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

export async function removePushSubscriptionsForSession(
  admin: SupabaseClient,
  sessionId: string
) {
  const { error } = await admin
    .from('personnel_push_subscriptions')
    .delete()
    .eq('session_id', sessionId);

  if (error && !isMissingPushTable(error.message)) throw new Error(error.message);
}

export async function dispatchPersonnelPush(
  admin: SupabaseClient,
  payload: PushPayload
): Promise<PushDispatchResult> {
  const vapid = getVapidConfig();
  if (!vapid) return { sent: 0, skipped: true, keyPairValid: false };

  if (!vapid.keyPairValid) {
    return {
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
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subs = await listActiveEmployeePushSubscriptions(admin, payload.employeeId);

  if (!subs.length) return { sent: 0, skipped: false, keyPairValid: true, targetCount: 0 };

  const pushBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href,
    notificationId: payload.notificationId,
  });

  let sent = 0;
  const staleIds: string[] = [];
  const errors: PushDispatchError[] = [];

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
        pushBody,
        {
          TTL: 60 * 60 * 24,
          urgency: 'high',
        }
      );
      sent += 1;
    } catch (e) {
      const err = e as { statusCode?: number; body?: string; message?: string };
      const status = err.statusCode;
      errors.push({
        statusCode: status,
        message: (err.body || err.message || 'Push gönderilemedi').slice(0, 240),
      });
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

  return {
    sent,
    skipped: false,
    keyPairValid: true,
    targetCount: subs.length,
    errors: errors.length ? errors : undefined,
  };
}
