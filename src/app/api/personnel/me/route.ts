import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { queryEmployeeById, queryPersonnelProfile } from '@/lib/employee-db';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { touchPushSubscriptionLastSeen } from '@/lib/personnel-push-service';
import { decryptField, maskIban } from '@/lib/field-encryption';
import { splitFullName } from '@/lib/format';
import { signedEmployeePhotoUrl } from '@/lib/photo-storage';
import strings from '@json/src/app/api/personnel/me/route.json';

async function loadSensitivePersonal(
  admin: ReturnType<typeof createAdminClient>,
  employeeId: string
) {
  const { data } = await admin
    .from('employee_sensitive_data')
    .select('tc_kimlik_enc, birth_date_enc, iban_enc')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!data) {
    return { tc_kimlik: null, birth_date: null, iban: null, iban_masked: null };
  }

  try {
    const tc = decryptField(data.tc_kimlik_enc);
    const birthDate = decryptField(data.birth_date_enc);
    const iban = decryptField(data.iban_enc);
    return {
      tc_kimlik: tc,
      birth_date: birthDate,
      iban,
      iban_masked: maskIban(iban),
    };
  } catch {
    return { tc_kimlik: null, birth_date: null, iban: null, iban_masked: null };
  }
}

async function loadProject(admin: ReturnType<typeof createAdminClient>, projectId: string) {
  const { data } = await admin
    .from('projects')
    .select('id, name, status, description, location, code, work_start_time, work_end_time, created_by')
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
    createdBy: data.created_by as string | null,
  };
}

async function loadProjectManager(
  admin: ReturnType<typeof createAdminClient>,
  createdBy: string | null | undefined
) {
  if (!createdBy) return null;

  const { data } = await admin
    .from('profiles')
    .select('full_name, phone')
    .eq('id', createdBy)
    .maybeSingle();

  if (!data?.phone?.trim()) return null;

  return {
    name: data.full_name ?? null,
    phone: data.phone.trim(),
  };
}

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    void touchPushSubscriptionLastSeen(admin, session.sessionId).catch(() => undefined);

    const { data: viewData, error: viewError } = await queryPersonnelProfile(
      admin,
      session.employeeId
    );

    if (!viewError && viewData) {
      const project = await loadProject(admin, viewData.project_id);
      const manager = project ? await loadProjectManager(admin, project.createdBy) : null;
      const [photo_url, sensitive] = await Promise.all([
        signedEmployeePhotoUrl(viewData.photo_path, viewData.photo_url),
        loadSensitivePersonal(admin, session.employeeId),
      ]);
      const { firstName, lastName } = splitFullName(viewData.name);
      return NextResponse.json({
        employee: {
          id: viewData.employee_id,
          name: viewData.name,
          first_name: firstName,
          last_name: lastName,
          email: viewData.email,
          phone: viewData.phone,
          daily_wage: viewData.daily_wage,
          position: viewData.position,
          hire_date: viewData.hire_date,
          photo_url,
          tc_kimlik: sensitive.tc_kimlik,
          birth_date: sensitive.birth_date,
          iban: sensitive.iban,
          iban_masked: sensitive.iban_masked,
          project_id: viewData.project_id,
          project_name: viewData.project_name,
          project: project
            ? {
                id: project.id,
                name: project.name,
                status: project.status,
                description: project.description,
                location: project.location,
                code: project.code,
                workStartTime: project.workStartTime,
                workEndTime: project.workEndTime,
              }
            : null,
          manager,
        },
      });
    }

    const { data, error } = await queryEmployeeById(admin, session.employeeId);

    if (error || !data) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    const project = data.project_id ? await loadProject(admin, data.project_id) : null;
    const manager = project ? await loadProjectManager(admin, project.createdBy) : null;

    const [photo_url, sensitive] = await Promise.all([
      signedEmployeePhotoUrl(data.photo_path, data.photo_url),
      loadSensitivePersonal(admin, session.employeeId),
    ]);
    const { firstName, lastName } = splitFullName(data.name);

    return NextResponse.json({
      employee: {
        ...data,
        first_name: firstName,
        last_name: lastName,
        photo_url,
        tc_kimlik: sensitive.tc_kimlik,
        birth_date: sensitive.birth_date,
        iban: sensitive.iban,
        iban_masked: sensitive.iban_masked,
        project_name: project?.name,
        project: project
          ? {
              id: project.id,
              name: project.name,
              status: project.status,
              description: project.description,
              location: project.location,
              code: project.code,
              workStartTime: project.workStartTime,
              workEndTime: project.workEndTime,
            }
          : null,
        manager,
      },
    });
  } catch {
    return NextResponse.json({ error: strings.oturumGeçersiz }, { status: 401 });
  }
}
