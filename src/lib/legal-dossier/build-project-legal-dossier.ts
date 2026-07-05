import { createAdminClient } from '@/utils/supabase/admin';
import { getCompanyInfo } from '@/lib/company-config';
import { buildLegalDossier } from './build-legal-dossier';
import { jsonFile, slugifyFilename } from './utils';
import { LEGAL_DOSSIER_SCHEMA_VERSION } from './types';
import type { DossierFile } from './types';

function prefixFiles(files: DossierFile[], prefix: string): DossierFile[] {
  const normalized = prefix.replace(/\/$/, '');
  return files.map((f) => ({
    ...f,
    path: `${normalized}/${f.path}`,
  }));
}

function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

async function collectProjectLevelFiles(projectId: string): Promise<DossierFile[]> {
  const admin = createAdminClient();
  const files: DossierFile[] = [];

  const { data: blocks } = await admin
    .from('project_blocks')
    .select('id, name, status, completed_at, notes, sort_order, created_at')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  const { data: teams } = await admin
    .from('project_teams')
    .select(
      `
      id,
      name,
      block_id,
      current_job_id,
      sort_order,
      created_at,
      team_members (
        employee_id,
        created_at
      )
    `
    )
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  files.push(
    jsonFile('proje-seviyesi/ekip-blok-atamalari.json', {
      blocks: blocks ?? [],
      teams: teams ?? [],
    })
  );

  const { data: wagePolicies } = await admin
    .from('wage_policies')
    .select('id, owner_id, use_company_default, policy, created_at, updated_at')
    .eq('project_id', projectId);

  files.push(jsonFile('proje-seviyesi/maas-politikasi.json', wagePolicies ?? []));

  const { data: dekontDrafts } = await admin
    .from('dekont_import_drafts')
    .select(
      `
      id,
      advance_request_id,
      proof_storage_backend,
      proof_external_id,
      proof_file_name,
      proof_mime_type,
      ocr_json,
      match_json,
      consumed_at,
      created_at,
      expires_at
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  files.push(
    jsonFile('proje-seviyesi/dekont-import-taslaklari.json', dekontDrafts ?? [])
  );

  return files;
}

async function buildClosureSummary(projectId: string, exportedAt: string) {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select(
      'id, name, code, status, closure_phase, closure_started_at, closure_deadline_at, closure_fast_path_deadline_at'
    )
    .eq('id', projectId)
    .maybeSingle();

  const { data: employees } = await admin
    .from('employees')
    .select('id, name, email, is_active')
    .eq('project_id', projectId)
    .order('name', { ascending: true });

  const { data: consents } = await admin
    .from('project_closure_consents')
    .select('employee_id, consented_at, data_exported_at, consent_version')
    .eq('project_id', projectId);

  const consentByEmployee = new Map(
    (consents ?? []).map((c) => [c.employee_id as string, c])
  );

  const activeCount = (employees ?? []).filter((e) => e.is_active).length;
  const consentCount = consents?.length ?? 0;

  return {
    schemaVersion: LEGAL_DOSSIER_SCHEMA_VERSION,
    exportedAt,
    project: project
      ? {
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
          closurePhase: project.closure_phase,
          closureStartedAt: project.closure_started_at,
          closureDeadlineAt: project.closure_deadline_at,
          fastPathDeadlineAt: project.closure_fast_path_deadline_at,
        }
      : null,
    personnel: {
      total: employees?.length ?? 0,
      active: activeCount,
      consented: consentCount,
      pendingConsent: Math.max(activeCount - consentCount, 0),
    },
    employees: (employees ?? []).map((emp) => {
      const consent = consentByEmployee.get(emp.id);
      return {
        id: emp.id,
        name: emp.name,
        emailMasked: maskEmail(emp.email),
        isActive: emp.is_active,
        consentedAt: consent?.consented_at ?? null,
        dataExportedAt: consent?.data_exported_at ?? null,
        consentVersion: consent?.consent_version ?? null,
      };
    }),
    company: getCompanyInfo(),
  };
}

export async function buildProjectLegalDossier(params: {
  projectId: string;
  exportedByEmail: string;
  exportedById?: string | null;
}) {
  const admin = createAdminClient();
  const exportedAt = new Date().toISOString();

  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('id, name, code')
    .eq('id', params.projectId)
    .maybeSingle();

  if (projectError || !project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const { data: employees, error: empError } = await admin
    .from('employees')
    .select('id, name')
    .eq('project_id', params.projectId)
    .order('name', { ascending: true });

  if (empError) {
    throw new Error(empError.message);
  }

  const files: DossierFile[] = [];
  const employeeSlugs: string[] = [];

  const closureSummary = await buildClosureSummary(params.projectId, exportedAt);
  files.push(jsonFile('00-meta/kapanis-ozeti.json', closureSummary));
  files.push(jsonFile('00-meta/isletme.json', getCompanyInfo()));

  for (const emp of employees ?? []) {
    const dossier = await buildLegalDossier({
      projectId: params.projectId,
      employeeId: emp.id,
      exportedByEmail: params.exportedByEmail,
      exportedById: params.exportedById ?? null,
      exportType: 'admin',
      skipExportLog: true,
    });

    const slug = slugifyFilename(emp.name);
    employeeSlugs.push(slug);
    files.push(...prefixFiles(dossier.files, `personeller/${slug}`));
  }

  files.push(...(await collectProjectLevelFiles(params.projectId)));

  const manifest = {
    schemaVersion: LEGAL_DOSSIER_SCHEMA_VERSION,
    exportType: 'admin_project' as const,
    exportedAt,
    exportedByEmail: params.exportedByEmail,
    project,
    employeeCount: employees?.length ?? 0,
    employeeFolders: employeeSlugs,
    sections: ['kapanis-ozeti', 'personel-dosyalari', 'proje-seviyesi'],
  };

  files.unshift(jsonFile('manifest.json', manifest));

  await logProjectExport({
    projectId: params.projectId,
    exportedBy: params.exportedById ?? null,
    exportedByEmail: params.exportedByEmail,
    employeeCount: employees?.length ?? 0,
  });

  return {
    projectName: project.name,
    projectCode: project.code,
    files,
    manifest,
  };
}

async function logProjectExport(params: {
  projectId: string;
  exportedBy: string | null;
  exportedByEmail: string;
  employeeCount: number;
}) {
  const admin = createAdminClient();
  const row = {
    project_id: params.projectId,
    employee_id: null,
    exported_by: params.exportedBy,
    exported_by_email: params.exportedByEmail,
    schema_version: LEGAL_DOSSIER_SCHEMA_VERSION,
    section_ids: ['admin_project'],
    export_type: 'admin_project',
    metadata: { employeeCount: params.employeeCount },
  };

  const { error } = await admin.from('legal_dossier_exports').insert(row);
  if (error && !error.message.includes('legal_dossier_exports')) {
    console.warn('[legal-dossier] project export audit:', error.message);
  }
}

export function projectDossierZipFilename(
  projectCode: string | null,
  projectName: string,
  exportedAt: string
): string {
  const date = exportedAt.slice(0, 10);
  const slug = slugifyFilename(projectCode || projectName);
  return `proje-${slug}-kapanis-${date}.zip`;
}
