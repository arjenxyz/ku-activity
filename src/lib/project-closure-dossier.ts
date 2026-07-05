import { createAdminClient } from '@/utils/supabase/admin';
import { PROJECT_CLOSURE_CONSENT_VERSION } from '@/lib/legal-dossier/types';

export type ClosurePhase = 'none' | 'pending_consents' | 'export_window' | 'purged';

export type PersonnelClosureStatus = {
  inClosure: boolean;
  phase: ClosurePhase;
  startedAt: string | null;
  deadlineAt: string | null;
  fastPathDeadlineAt: string | null;
  consentVersion: string;
  consent: {
    consentedAt: string;
    dataExportedAt: string | null;
    dataExportAcknowledgedAt: string | null;
  } | null;
  lastDossierDownloadAt: string | null;
};

const ACTIVE_CLOSURE_PHASES = new Set<ClosurePhase>(['pending_consents', 'export_window']);

export async function getPersonnelClosureStatus(
  projectId: string,
  employeeId: string
): Promise<PersonnelClosureStatus> {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select(
      'closure_phase, closure_started_at, closure_deadline_at, closure_fast_path_deadline_at'
    )
    .eq('id', projectId)
    .maybeSingle();

  const phase = (project?.closure_phase ?? 'none') as ClosurePhase;
  const inClosure = ACTIVE_CLOSURE_PHASES.has(phase);

  const { data: consent } = await admin
    .from('project_closure_consents')
    .select('consented_at, data_exported_at, data_export_acknowledged_at, consent_version')
    .eq('project_id', projectId)
    .eq('employee_id', employeeId)
    .maybeSingle();

  const { data: lastExport } = await admin
    .from('legal_dossier_exports')
    .select('created_at')
    .eq('employee_id', employeeId)
    .eq('project_id', projectId)
    .eq('export_type', 'personnel_self')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    inClosure,
    phase,
    startedAt: project?.closure_started_at ?? null,
    deadlineAt: project?.closure_deadline_at ?? null,
    fastPathDeadlineAt: project?.closure_fast_path_deadline_at ?? null,
    consentVersion: consent?.consent_version ?? PROJECT_CLOSURE_CONSENT_VERSION,
    consent: consent
      ? {
          consentedAt: consent.consented_at,
          dataExportedAt: consent.data_exported_at,
          dataExportAcknowledgedAt: consent.data_export_acknowledged_at,
        }
      : null,
    lastDossierDownloadAt: lastExport?.created_at ?? consent?.data_exported_at ?? null,
  };
}

export async function recordClosureConsent(params: {
  projectId: string;
  employeeId: string;
  userAgent?: string | null;
}) {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select('closure_phase')
    .eq('id', params.projectId)
    .maybeSingle();

  const phase = (project?.closure_phase ?? 'none') as ClosurePhase;
  if (!ACTIVE_CLOSURE_PHASES.has(phase)) {
    throw new Error('CLOSURE_NOT_ACTIVE');
  }

  const now = new Date().toISOString();
  const { error } = await admin.from('project_closure_consents').upsert(
    {
      project_id: params.projectId,
      employee_id: params.employeeId,
      consent_version: PROJECT_CLOSURE_CONSENT_VERSION,
      consented_at: now,
      user_agent: params.userAgent ?? null,
    },
    { onConflict: 'project_id,employee_id' }
  );

  if (error) throw new Error(error.message);

  await admin.from('project_closure_audit').insert({
    project_id: params.projectId,
    event_type: 'personnel_consent',
    actor_role: 'personnel',
    payload: {
      employeeId: params.employeeId,
      consentVersion: PROJECT_CLOSURE_CONSENT_VERSION,
    },
  });

  const { maybeAdvanceClosureAfterConsent } = await import('@/lib/project-closure-service');
  await maybeAdvanceClosureAfterConsent(params.projectId).catch(() => undefined);
}

export async function recordPersonnelDossierExported(params: {
  projectId: string;
  employeeId: string;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from('project_closure_consents')
    .select('id')
    .eq('project_id', params.projectId)
    .eq('employee_id', params.employeeId)
    .maybeSingle();

  if (existing) {
    await admin
      .from('project_closure_consents')
      .update({ data_exported_at: now })
      .eq('id', existing.id);
  }

  const { data: project } = await admin
    .from('projects')
    .select('closure_phase')
    .eq('id', params.projectId)
    .maybeSingle();

  if (ACTIVE_CLOSURE_PHASES.has((project?.closure_phase ?? 'none') as ClosurePhase)) {
    await admin.from('project_closure_audit').insert({
      project_id: params.projectId,
      event_type: 'personnel_dossier_download',
      actor_role: 'personnel',
      payload: { employeeId: params.employeeId, at: now },
    });
  }
}

export async function acknowledgePersonnelDossierDownload(params: {
  projectId: string;
  employeeId: string;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: consent } = await admin
    .from('project_closure_consents')
    .select('id, data_exported_at')
    .eq('project_id', params.projectId)
    .eq('employee_id', params.employeeId)
    .maybeSingle();

  if (!consent) {
    throw new Error('CONSENT_REQUIRED');
  }

  if (!consent.data_exported_at) {
    throw new Error('DOWNLOAD_REQUIRED');
  }

  const { error } = await admin
    .from('project_closure_consents')
    .update({ data_export_acknowledged_at: now })
    .eq('id', consent.id);

  if (error) throw new Error(error.message);

  await admin.from('project_closure_audit').insert({
    project_id: params.projectId,
    event_type: 'personnel_export_acknowledged',
    actor_role: 'personnel',
    payload: { employeeId: params.employeeId, at: now },
  });
}
