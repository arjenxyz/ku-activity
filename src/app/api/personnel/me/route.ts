import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { queryEmployeeById, queryPersonnelProfile } from '@/lib/employee-db';
import { requirePersonnelSession } from '@/lib/personnel-auth';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const { data: viewData, error: viewError } = await queryPersonnelProfile(
      admin,
      session.employeeId
    );

    if (!viewError && viewData) {
      return NextResponse.json({
        employee: {
          id: viewData.employee_id,
          name: viewData.name,
          email: viewData.email,
          phone: viewData.phone,
          daily_wage: viewData.daily_wage,
          position: viewData.position,
          hire_date: viewData.hire_date,
          photo_url: viewData.photo_url ?? null,
          project_id: viewData.project_id,
          project_name: viewData.project_name,
        },
      });
    }

    const { data, error } = await queryEmployeeById(admin, session.employeeId);

    if (error || !data) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const { data: project } = await admin
      .from('projects')
      .select('name')
      .eq('id', data.project_id!)
      .maybeSingle();

    return NextResponse.json({
      employee: {
        ...data,
        photo_url: data.photo_url ?? null,
        project_name: project?.name,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}
