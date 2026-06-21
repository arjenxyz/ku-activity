import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  buildAttendanceQrUrl,
  regeneratePersonalAttendanceToken,
} from '@/lib/attendance-qr-service';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json().catch(() => ({}));
    const employeeId = typeof body.employeeId === 'string' ? body.employeeId : '';
    const workDate =
      (typeof body.date === 'string' ? body.date.slice(0, 10) : null) ??
      dayjs().format('YYYY-MM-DD');

    if (!employeeId) {
      return NextResponse.json({ error: 'Personel seçin' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: employee } = await admin
      .from('employees')
      .select('id, name, project_id')
      .eq('id', employeeId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (!employee) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const personal = await regeneratePersonalAttendanceToken(admin, {
      projectId,
      employeeId,
      workDate,
      createdBy: user.id,
    });

    const origin = new URL(request.url).origin;

    return NextResponse.json({
      employee: { id: employee.id, name: employee.name },
      personal: {
        token: personal.token,
        url: buildAttendanceQrUrl(personal.token, origin),
        work_date: personal.work_date,
      },
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
