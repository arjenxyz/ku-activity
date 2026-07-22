import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import { purgeDueProjectsForAdmin } from '@/lib/project-closure-purge';

export const dynamic = 'force-dynamic';

/** Proje listesi açılınca arka planda: süresi dolmuş kapanışları temizle */
export async function POST() {
  try {
    await requireAdminUser();
    const supabase = await createClient();
    const result = await purgeDueProjectsForAdmin(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
