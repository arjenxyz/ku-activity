import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  EMPLOYEE_PHOTOS_BUCKET,
  employeePhotoObjectPath,
} from '@/lib/photo-storage';
import { revokeAllPersonnelSessionsForEmployee } from '@/lib/personnel-session-service';

export async function purgeEmployeeAfterClosure(params: {
  projectId: string;
  employeeId: string;
}): Promise<boolean> {
  const admin = createAdminClient();

  const { data: employee } = await admin
    .from('employees')
    .select('id, project_id')
    .eq('id', params.employeeId)
    .eq('project_id', params.projectId)
    .maybeSingle();

  if (!employee) return false;

  const exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  await Promise.all(
    exts.map((ext) =>
      admin.storage
        .from(EMPLOYEE_PHOTOS_BUCKET)
        .remove([employeePhotoObjectPath(params.projectId, params.employeeId, ext)])
    )
  ).catch(() => undefined);

  await revokeAllPersonnelSessionsForEmployee(admin, params.employeeId).catch(() => undefined);

  const { error } = await admin.from('employees').delete().eq('id', params.employeeId);

  if (error) throw new Error(error.message);

  await admin.from('project_closure_audit').insert({
    project_id: params.projectId,
    event_type: 'personnel_purged',
    actor_role: 'system',
    payload: { employeeId: params.employeeId, at: new Date().toISOString() },
  });

  return true;
}

/** Hızlandırılmış silme süresi dolduysa personeli temizler (cron gerekmez). */
export async function maybePurgeAcceleratedEmployee(
  projectId: string,
  employeeId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: consent } = await admin
    .from('project_closure_consents')
    .select('accelerated_deletion_at')
    .eq('project_id', projectId)
    .eq('employee_id', employeeId)
    .maybeSingle();

  const dueAt = consent?.accelerated_deletion_at;
  if (!dueAt || new Date(dueAt).getTime() > Date.now()) {
    return false;
  }

  return purgeEmployeeAfterClosure({ projectId, employeeId });
}
