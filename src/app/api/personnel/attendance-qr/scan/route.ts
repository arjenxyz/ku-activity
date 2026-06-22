import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { scanAttendanceQr, getPersonnelAttendanceStatus } from '@/lib/attendance-qr-service';
import {
  ATTENDANCE_MESSAGE_CODES,
  isAttendanceScanError,
  resolveAttendanceLocale,
  tAttendance,
} from '@/lib/i18n/attendance-messages';

export async function POST(request: Request) {
  const locale = resolveAttendanceLocale(request.headers.get('accept-language'));

  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const replacePrevious = body.replace === true;

    if (!token) {
      return NextResponse.json(
        {
          error: tAttendance(ATTENDANCE_MESSAGE_CODES.TOKEN_REQUIRED, locale),
          errorCode: ATTENDANCE_MESSAGE_CODES.TOKEN_REQUIRED,
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const result = await scanAttendanceQr(admin, {
      token,
      employeeId: session.employeeId,
      projectId: session.projectId,
      replacePrevious,
      locale,
    });

    const status = await getPersonnelAttendanceStatus(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate: result.workDate,
      locale,
    });

    let message: string;
    let messageCode = status.messageCode;

    if (replacePrevious && !result.alreadyListed) {
      messageCode = ATTENDANCE_MESSAGE_CODES.SCAN_REPLACED;
      message = tAttendance(messageCode, locale);
    } else if (result.alreadyListed) {
      messageCode = ATTENDANCE_MESSAGE_CODES.ALREADY_LISTED;
      message = tAttendance(messageCode, locale);
    } else {
      messageCode = ATTENDANCE_MESSAGE_CODES.SCAN_SUCCESS;
      message = tAttendance(messageCode, locale);
    }

    return NextResponse.json({
      ok: true,
      alreadyListed: result.alreadyListed,
      replaced: replacePrevious && !result.alreadyListed,
      message,
      messageCode,
      workDate: result.workDate,
      status,
    });
  } catch (err) {
    if (isAttendanceScanError(err)) {
      return NextResponse.json(
        { error: err.message, errorCode: err.code },
        { status: err.code === ATTENDANCE_MESSAGE_CODES.ALREADY_LISTED ? 409 : 400 }
      );
    }

    const message = err instanceof Error ? err.message : tAttendance(ATTENDANCE_MESSAGE_CODES.SCAN_FAILED, locale);
    return NextResponse.json(
      { error: message, errorCode: ATTENDANCE_MESSAGE_CODES.SCAN_FAILED },
      { status: 400 }
    );
  }
}
