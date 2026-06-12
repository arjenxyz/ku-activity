import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { queryEmployeeById, queryPersonnelProfile } from '@/lib/employee-db';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { decryptField, maskIban } from '@/lib/field-encryption';
import { signedEmployeePhotoUrl } from '@/lib/photo-storage';

async function loadMaskedIban(admin: ReturnType<typeof createAdminClient>, employeeId: string) {
  const { data } = await admin
    .from('employee_sensitive_data')
    .select('iban_enc')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!data?.iban_enc) return null;
  try {
    return maskIban(decryptField(data.iban_enc));
  } catch {
    return null;
  }
}

async function loadProject(admin: ReturnType<typeof createAdminClient>, projectId: string) {
  const { data } = await admin
    .from('projects')
    .select('id, name, status, description, location, code, work_start_time, work_end_time')
    .eq('id', projectId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    status: String(data.status),
    description: data.description ?? null,
    location: data.location ?? null,
    code: data.code ?? null,
    workStartTime: data.work_start_time ?? null,
    workEndTime: data.work_end_time ?? null,
  };
}

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const { data: viewData, error: viewError } = await queryPersonnelProfile(
      admin,
      session.employeeId
    );

    if (!viewError && viewData) {
      const project = await loadProject(admin, viewData.project_id);
      const [photo_url, iban_masked] = await Promise.all([
        signedEmployeePhotoUrl(viewData.photo_path, viewData.photo_url),
        loadMaskedIban(admin, session.employeeId),
      ]);
      return NextResponse.json({
        employee: {
          id: viewData.employee_id,
          name: viewData.name,
          email: viewData.email,
          phone: viewData.phone,
          daily_wage: viewData.daily_wage,
          position: viewData.position,
          hire_date: viewData.hire_date,
          photo_url,
          iban_masked,
          project_id: viewData.project_id,
          project_name: viewData.project_name,
          project,
        },
      });
    }

    const { data, error } = await queryEmployeeById(admin, session.employeeId);

    if (error || !data) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const project = data.project_id ? await loadProject(admin, data.project_id) : null;

    const [photo_url, iban_masked] = await Promise.all([
      signedEmployeePhotoUrl(data.photo_path, data.photo_url),
      loadMaskedIban(admin, session.employeeId),
    ]);

    return NextResponse.json({
      employee: {
        ...data,
        photo_url,
        iban_masked,
        project_name: project?.name,
        project,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}
