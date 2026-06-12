import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { getWorkLogApprovalStatus } from '@/lib/work-log';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const today = dayjs().format('YYYY-MM-DD');
    const admin = createAdminClient();

    const [{ data: log }, { data: project }] = await Promise.all([
      admin
        .from('work_logs')
        .select(
          'id, date, amount, mesai_type, mesai_units, description, approved, admin_confirmed_at, employee_confirmed_at'
        )
        .eq('employee_id', session.employeeId)
        .eq('date', today)
        .maybeSingle(),
      admin
        .from('projects')
        .select('work_start_time, work_end_time, name')
        .eq('id', session.projectId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      date: today,
      workLog: log ?? null,
      status: log ? getWorkLogApprovalStatus(log) : 'none',
      project: project
        ? {
            name: project.name,
            workStartTime: project.work_start_time,
            workEndTime: project.work_end_time,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}
