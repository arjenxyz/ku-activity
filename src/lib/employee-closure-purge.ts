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

export async function purgeDueAcceleratedEmployees(): Promise<{ purged: number; errors: string[] }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const errors: string[] = [];
  let purged = 0;

  const { data: dueRows, error } = await admin
    .from('project_closure_consents')
    .select('project_id, employee_id')
    .not('accelerated_deletion_at', 'is', null)
    .lte('accelerated_deletion_at', now);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of dueRows ?? []) {
    try {
      const didPurge = await purgeEmployeeAfterClosure({
        projectId: row.project_id as string,
        employeeId: row.employee_id as string,
      });
      if (didPurge) purged += 1;
    } catch (err) {
      errors.push(
        `${row.employee_id}: ${err instanceof Error ? err.message : 'purge failed'}`
      );
    }
  }

  return { purged, errors };
}
