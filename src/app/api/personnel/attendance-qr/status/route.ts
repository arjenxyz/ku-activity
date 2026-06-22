import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { getPersonnelAttendanceStatus } from '@/lib/attendance-qr-service';
import {
  getAttendanceWindowStatus,
  getCurrentOpenWorkDate,
  getProjectCalendarDate,
  loadProjectAttendanceSchedule,
} from '@/lib/attendance-window';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const { searchParams } = new URL(request.url);

    const admin = createAdminClient();
    const schedule = await loadProjectAttendanceSchedule(admin, session.projectId);
    const openDate = getCurrentOpenWorkDate(schedule);
    const workDate =
      searchParams.get('date')?.slice(0, 10) ??
      openDate ??
      getProjectCalendarDate(schedule);

    const status = await getPersonnelAttendanceStatus(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate,
    });
    const window = getAttendanceWindowStatus(workDate, schedule);

    return NextResponse.json({ ...status, window });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Durum alınamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
