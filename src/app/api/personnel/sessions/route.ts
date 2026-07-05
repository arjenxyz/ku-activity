import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { parseUserAgent } from '@/lib/parse-user-agent';
import { listEmployeePushSubscriptions } from '@/lib/personnel-push-service';
import {
  listActivePersonnelSessions,
  touchPersonnelSessionActivity,
} from '@/lib/personnel-session-service';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    await touchPersonnelSessionActivity(
      admin,
      session.sessionId,
      request.headers.get('user-agent') ?? undefined
    ).catch(() => undefined);

    const [sessions, pushSubs] = await Promise.all([
      listActivePersonnelSessions(admin, session.employeeId),
      listEmployeePushSubscriptions(admin, session.employeeId).catch(() => []),
    ]);

    const pushUaBySession = new Map(
      pushSubs
        .filter((sub) => sub.session_id)
        .map((sub) => [sub.session_id as string, sub.user_agent as string | null])
    );

    const devices = sessions.map((row) => {
      const userAgent = row.userAgent ?? pushUaBySession.get(row.id) ?? null;
      const parsed = parseUserAgent(userAgent);

      return {
        sessionId: row.id,
        isCurrent: row.id === session.sessionId,
        userAgent,
        deviceKind: parsed.kind,
        deviceLabel: parsed.label,
        browser: parsed.browser,
        os: parsed.os,
        createdAt: row.createdAt,
        lastSeenAt: row.lastSeenAt,
      };
    });

    return NextResponse.json({
      currentSessionId: session.sessionId,
      devices,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Cihazlar alınamadı';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
