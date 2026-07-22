import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/utils/supabase/admin';
import { EMPLOYEE_PHOTOS_BUCKET } from '@/lib/photo-storage';
import { revokeAllPersonnelSessionsForEmployee } from '@/lib/personnel-session-service';
import { purgeEmployeeAfterClosure } from '@/lib/employee-closure-purge';
import type { ClosurePhase } from '@/lib/closure-phase';

const ACTIVE_CLOSURE_PHASES = new Set<ClosurePhase>(['pending_consents', 'export_window']);

async function removeProjectPhotoFolder(admin: SupabaseClient, projectId: string) {
  const { data, error } = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).list(projectId, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !data?.length) return;

  const paths = data
    .filter((item) => Boolean(item.name))
    .map((item) => `${projectId}/${item.name}`);

  const chunkSize = 100;
  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize);
    await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).remove(chunk).catch(() => undefined);
  }
}

/**
 * Kapanış süresi dolmuş projeyi tamamen siler (personel + cascade kayıtlar + fotoğraflar).
 * Anında silme yerine kapanış akışının son adımı.
 */
export async function purgeProjectAfterClosureDeadline(projectId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select('id, name, closure_phase, closure_deadline_at')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) return false;

  const phase = (project.closure_phase ?? 'none') as ClosurePhase;
  if (!ACTIVE_CLOSURE_PHASES.has(phase)) return false;

  const deadlineAt = project.closure_deadline_at;
  if (!deadlineAt || new Date(deadlineAt).getTime() > Date.now()) {
    return false;
  }

  const { data: employees } = await admin
    .from('employees')
    .select('id')
    .eq('project_id', projectId);

  for (const employee of employees ?? []) {
    await revokeAllPersonnelSessionsForEmployee(admin, employee.id).catch(() => undefined);
  }

  await removeProjectPhotoFolder(admin, projectId);

  const { error, count } = await admin
    .from('projects')
    .delete({ count: 'exact' })
    .eq('id', projectId)
    .in('closure_phase', ['pending_consents', 'export_window'])
    .lte('closure_deadline_at', new Date().toISOString());

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

/** Süre dolduysa projeyi temizler; aksi halde false. */
export async function maybePurgeProjectIfDeadlinePassed(projectId: string): Promise<boolean> {
  try {
    return await purgeProjectAfterClosureDeadline(projectId);
  } catch (err) {
    console.error('[project-closure-purge] project', projectId, err);
    return false;
  }
}

async function purgeDueAcceleratedEmployees(admin: SupabaseClient): Promise<number> {
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await admin
    .from('project_closure_consents')
    .select('project_id, employee_id')
    .not('accelerated_deletion_at', 'is', null)
    .lte('accelerated_deletion_at', nowIso);

  if (error || !rows?.length) return 0;

  let purged = 0;
  for (const row of rows) {
    try {
      const ok = await purgeEmployeeAfterClosure({
        projectId: row.project_id,
        employeeId: row.employee_id,
      });
      if (ok) purged += 1;
    } catch (err) {
      console.error('[project-closure-purge] accelerated employee', row.employee_id, err);
    }
  }
  return purged;
}

export type ProjectClosurePurgeCronResult = {
  projectsScanned: number;
  projectsPurged: number;
  acceleratedEmployeesPurged: number;
  errors: string[];
};

async function purgeProjectIds(
  projectIds: string[]
): Promise<{ projectsPurged: number; purgedIds: string[]; errors: string[] }> {
  const errors: string[] = [];
  const purgedIds: string[] = [];

  for (const projectId of projectIds) {
    try {
      const ok = await purgeProjectAfterClosureDeadline(projectId);
      if (ok) purgedIds.push(projectId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${projectId}: ${message}`);
      console.error('[project-closure-purge] project', projectId, err);
    }
  }

  return { projectsPurged: purgedIds.length, purgedIds, errors };
}

/** Yönetici: erişebildiği süresi dolmuş kapanış projelerini siler. */
export async function purgeDueProjectsForAdmin(
  accessibleClient: SupabaseClient
): Promise<{ projectsScanned: number; projectsPurged: number; purgedIds: string[]; errors: string[] }> {
  const nowIso = new Date().toISOString();

  const { data: dueProjects, error } = await accessibleClient
    .from('projects')
    .select('id')
    .in('closure_phase', ['pending_consents', 'export_window'])
    .not('closure_deadline_at', 'is', null)
    .lte('closure_deadline_at', nowIso);

  if (error) {
    throw new Error(error.message);
  }

  const ids = (dueProjects ?? []).map((row) => row.id as string);
  const result = await purgeProjectIds(ids);

  return {
    projectsScanned: ids.length,
    ...result,
  };
}

/** Cron: süresi dolan kapanış projelerini ve hızlandırılmış personelleri temizler. */
export async function runProjectClosurePurgeCron(
  admin: SupabaseClient = createAdminClient()
): Promise<ProjectClosurePurgeCronResult> {
  const nowIso = new Date().toISOString();

  const acceleratedEmployeesPurged = await purgeDueAcceleratedEmployees(admin);

  const { data: dueProjects, error } = await admin
    .from('projects')
    .select('id')
    .in('closure_phase', ['pending_consents', 'export_window'])
    .not('closure_deadline_at', 'is', null)
    .lte('closure_deadline_at', nowIso);

  if (error) {
    throw new Error(error.message);
  }

  const ids = (dueProjects ?? []).map((row) => row.id as string);
  const { projectsPurged, errors } = await purgeProjectIds(ids);

  return {
    projectsScanned: ids.length,
    projectsPurged,
    acceleratedEmployeesPurged,
    errors,
  };
}
