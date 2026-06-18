import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Supabase ücretsiz planda ~7 gün hareketsizlikten sonra projeyi duraklatır.
 * cron-job.org ile 6–12 saatte bir GET isteği gönderin (Vercel Cron kullanılmaz).
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const started = Date.now();

  try {
    const admin = createAdminClient();

    const { count, error } = await admin
      .from('projects')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, durationMs: Date.now() - started },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      purpose: 'supabase-keepalive',
      projectCount: count ?? 0,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Keepalive başarısız';
    return NextResponse.json(
      { ok: false, error: message, durationMs: Date.now() - started },
      { status: 500 }
    );
  }
}
