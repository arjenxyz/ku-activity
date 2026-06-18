import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { recordKeepaliveRun } from '@/lib/supabase-keepalive';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Supabase ücretsiz planda ~7 gün hareketsizlikten sonra projeyi duraklatır.
 * cron-job.org ile 6–12 saatte bir GET isteği gönderin (Vercel Cron kullanılmaz).
 * Sonuçlar /supabase sayfasında görüntülenir.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const started = Date.now();
  const userAgent = request.headers.get('user-agent');

  try {
    const admin = createAdminClient();

    const { count, error } = await admin
      .from('projects')
      .select('id', { count: 'exact', head: true });

    const durationMs = Date.now() - started;

    if (error) {
      await recordKeepaliveRun({
        ok: false,
        durationMs,
        errorMessage: error.message,
        userAgent,
      });

      return NextResponse.json(
        { ok: false, error: error.message, durationMs },
        { status: 500 }
      );
    }

    const projectCount = count ?? 0;

    await recordKeepaliveRun({
      ok: true,
      projectCount,
      durationMs,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      purpose: 'supabase-keepalive',
      projectCount,
      durationMs,
      at: new Date().toISOString(),
      recorded: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Keepalive başarısız';
    const durationMs = Date.now() - started;

    await recordKeepaliveRun({
      ok: false,
      durationMs,
      errorMessage: message,
      userAgent,
    });

    return NextResponse.json(
      { ok: false, error: message, durationMs },
      { status: 500 }
    );
  }
}
