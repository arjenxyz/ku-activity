import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { listEmployeeAbsenceDatesInMonth } from '@/lib/attendance-day-absence';

/** Personelin ay içi işe çıkmama / izin bildirimleri */
export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const { searchParams } = new URL(request.url);
    const month = (searchParams.get('month') || new Date().toISOString().slice(0, 7)).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Geçersiz ay' }, { status: 400 });
    }

    const admin = createAdminClient();
    const dates = await listEmployeeAbsenceDatesInMonth(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      month,
    });

    return NextResponse.json({ month, dates });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Liste alınamadı';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
