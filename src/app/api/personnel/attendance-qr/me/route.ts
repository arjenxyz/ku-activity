import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  buildAttendanceQrUrl,
  getActivePersonalToken,
  getOrCreatePersonalAttendanceToken,
} from '@/lib/attendance-qr-service';
import { getWorkLogApprovalStatus } from '@/lib/work-log';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const { searchParams } = new URL(request.url);
    const workDate =
      searchParams.get('date')?.slice(0, 10) ?? dayjs().format('YYYY-MM-DD');

    const admin = createAdminClient();

    const { data: workLog } = await admin
      .from('work_logs')
      .select('id, date, approved, employee_confirmed_at, admin_confirmed_at, amount, mesai_type')
      .eq('employee_id', session.employeeId)
      .eq('date', workDate)
      .maybeSingle();

    const alreadyCheckedIn = Boolean(
      workLog?.employee_confirmed_at && workLog?.admin_confirmed_at
    );

    if (alreadyCheckedIn) {
      return NextResponse.json({
        workDate,
        alreadyCheckedIn: true,
        status: getWorkLogApprovalStatus(workLog!),
        personal: null,
      });
    }

    let personal = await getActivePersonalToken(admin, session.employeeId, workDate);

    if (!personal) {
      personal = await getOrCreatePersonalAttendanceToken(admin, {
        projectId: session.projectId,
        employeeId: session.employeeId,
        workDate,
      });
    }

    const origin = new URL(request.url).origin;

    return NextResponse.json({
      workDate,
      alreadyCheckedIn: false,
      personal: personal
        ? {
            token: personal.token,
            url: buildAttendanceQrUrl(personal.token, origin),
            work_date: personal.work_date,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kişisel kod yüklenemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
