import { createAdminClient } from '@/utils/supabase/admin';
import { notifyPersonnel } from '@/lib/personnel-notification-service';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/project-closure-service.json';
import type { ClosurePhase } from '@/lib/project-closure-dossier';

export const CLOSURE_DEFAULT_DEADLINE_DAYS = 30;
export const CLOSURE_FAST_PATH_DAYS = 7;

const ACTIVE_CLOSURE_PHASES = new Set<ClosurePhase>(['pending_consents', 'export_window']);

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export type ProjectClosureSummary = {
  phase: ClosurePhase;
  startedAt: string | null;
  deadlineAt: string | null;
  fastPathDeadlineAt: string | null;
  activeEmployeeCount: number;
  consentCount: number;
  allConsented: boolean;
};

export async function getProjectClosureSummary(projectId: string): Promise<ProjectClosureSummary> {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select(
      'closure_phase, closure_started_at, closure_deadline_at, closure_fast_path_deadline_at'
    )
    .eq('id', projectId)
    .maybeSingle();

  const { count: activeCount } = await admin
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('is_active', true);

  const { count: consentCount } = await admin
    .from('project_closure_consents')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const activeEmployeeCount = activeCount ?? 0;
  const consented = consentCount ?? 0;

  return {
    phase: (project?.closure_phase ?? 'none') as ClosurePhase,
    startedAt: project?.closure_started_at ?? null,
    deadlineAt: project?.closure_deadline_at ?? null,
    fastPathDeadlineAt: project?.closure_fast_path_deadline_at ?? null,
    activeEmployeeCount,
    consentCount: consented,
    allConsented: activeEmployeeCount > 0 && consented >= activeEmployeeCount,
  };
}

export async function startProjectClosure(params: {
  projectId: string;
  startedByEmail?: string | null;
}) {
  const admin = createAdminClient();

  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('id, name, closure_phase')
    .eq('id', params.projectId)
    .maybeSingle();

  if (projectError || !project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const phase = (project.closure_phase ?? 'none') as ClosurePhase;
  if (ACTIVE_CLOSURE_PHASES.has(phase)) {
    throw new Error('ALREADY_IN_CLOSURE');
  }
  if (phase === 'purged') {
    throw new Error('ALREADY_PURGED');
  }

  const now = new Date();
  const deadline = addDays(now, CLOSURE_DEFAULT_DEADLINE_DAYS);

  const { error: updateError } = await admin
    .from('projects')
    .update({
      closure_phase: 'pending_consents',
      closure_started_at: now.toISOString(),
      closure_deadline_at: deadline.toISOString(),
      closure_fast_path_deadline_at: null,
      status: 'archived',
      updated_at: now.toISOString(),
    })
    .eq('id', params.projectId);

  if (updateError) throw new Error(updateError.message);

  const { data: employees } = await admin
    .from('employees')
    .select('id')
    .eq('project_id', params.projectId)
    .eq('is_active', true);

  const deadlineLabel = deadline.toLocaleDateString('tr-TR');
  for (const employee of employees ?? []) {
    await notifyPersonnel(admin, {
      employeeId: employee.id,
      projectId: params.projectId,
      type: 'general',
      title: formatString(strings.notify.title, { projectName: project.name }),
      body: formatString(strings.notify.body, { deadline: deadlineLabel }),
      href: '/personnel-panel?tab=rights',
      dedupeKey: `closure-start:${params.projectId}:${employee.id}`,
      sendPush: true,
    }).catch(() => undefined);
  }

  await admin.from('project_closure_audit').insert({
    project_id: params.projectId,
    event_type: 'closure_started',
    actor_role: 'admin',
    actor_email_masked: params.startedByEmail ?? null,
    payload: {
      deadlineAt: deadline.toISOString(),
      activeEmployees: employees?.length ?? 0,
    },
  });

  return {
    phase: 'pending_consents' as const,
    deadlineAt: deadline.toISOString(),
    notifiedCount: employees?.length ?? 0,
  };
}

/** Tüm aktif personel onayladıysa export penceresine geç (7 gün). */
export async function maybeAdvanceClosureAfterConsent(projectId: string) {
  const admin = createAdminClient();
  const summary = await getProjectClosureSummary(projectId);

  if (summary.phase !== 'pending_consents' || !summary.allConsented) {
    return false;
  }

  const now = new Date();
  const fastDeadline = addDays(now, CLOSURE_FAST_PATH_DAYS);

  await admin
    .from('projects')
    .update({
      closure_phase: 'export_window',
      closure_fast_path_deadline_at: fastDeadline.toISOString(),
      closure_deadline_at: fastDeadline.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', projectId);

  await admin.from('project_closure_audit').insert({
    project_id: projectId,
    event_type: 'closure_export_window',
    actor_role: 'system',
    payload: { fastPathDeadlineAt: fastDeadline.toISOString() },
  });

  return true;
}

export function isProjectInClosure(phase: string | null | undefined) {
  return ACTIVE_CLOSURE_PHASES.has((phase ?? 'none') as ClosurePhase);
}
