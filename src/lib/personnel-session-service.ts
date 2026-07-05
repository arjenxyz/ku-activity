import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { removePushSubscriptionsForSession } from '@/lib/personnel-push-service';

export type PersonnelActiveSession = {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  userAgent: string | null;
};

function isMissingSessionColumn(message: string) {
  return message.includes('user_agent') || message.includes('last_seen_at');
}

export async function listActivePersonnelSessions(
  admin: SupabaseClient,
  employeeId: string
): Promise<PersonnelActiveSession[]> {
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('personnel_sessions')
    .select('id, created_at, last_seen_at, user_agent')
    .eq('employee_id', employeeId)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .order('last_seen_at', { ascending: false });

  if (error) {
    if (isMissingSessionColumn(error.message)) {
      const fallback = await admin
        .from('personnel_sessions')
        .select('id, created_at')
        .eq('employee_id', employeeId)
        .is('revoked_at', null)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map((row) => ({
        id: row.id as string,
        createdAt: row.created_at as string,
        lastSeenAt: row.created_at as string,
        userAgent: null,
      }));
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    lastSeenAt: (row.last_seen_at as string | null) ?? (row.created_at as string),
    userAgent: (row.user_agent as string | null) ?? null,
  }));
}

export async function touchPersonnelSessionActivity(
  admin: SupabaseClient,
  sessionId: string,
  userAgent?: string
) {
  const now = new Date().toISOString();
  const patch: { last_seen_at: string; user_agent?: string } = { last_seen_at: now };
  if (userAgent) patch.user_agent = userAgent.slice(0, 500);

  const { error } = await admin
    .from('personnel_sessions')
    .update(patch)
    .eq('id', sessionId)
    .is('revoked_at', null);

  if (error && !isMissingSessionColumn(error.message)) {
    throw new Error(error.message);
  }
}

export async function revokePersonnelSessionById(
  admin: SupabaseClient,
  params: { employeeId: string; sessionId: string }
): Promise<boolean> {
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('personnel_sessions')
    .update({ revoked_at: now })
    .eq('id', params.sessionId)
    .eq('employee_id', params.employeeId)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;

  await removePushSubscriptionsForSession(admin, params.sessionId);
  return true;
}
