import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { getPersonnelAttendanceStatus } from '@/lib/attendance-qr-service';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const { searchParams } = new URL(request.url);
    const workDate =
      searchParams.get('date')?.slice(0, 10) ?? dayjs().format('YYYY-MM-DD');

    const admin = createAdminClient();
    const status = await getPersonnelAttendanceStatus(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate,
    });

    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Durum alınamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
