import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Lightweight ping so a free-tier Supabase project does not pause.
 * Query is against the new `profiles` table — never touches CrewLedger schema.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  try {
    const admin = createAdminClient();
    const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true });
    const durationMs = Date.now() - started;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, durationMs },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profiles: count ?? 0,
      durationMs,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Keepalive failed',
        durationMs: Date.now() - started,
      },
      { status: 500 }
    );
  }
}
