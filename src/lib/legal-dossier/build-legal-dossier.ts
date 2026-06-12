import { createAdminClient } from '@/utils/supabase/admin';
import { decryptField } from '@/lib/field-encryption';
import { APP_NAME } from '@/lib/brand';
import './collectors';
import { getDossierCollectors } from './registry';
import { renderDossierSummaryHtml } from './render-summary-html';
import { jsonFile, slugifyFilename } from './utils';
import {
  LEGAL_DOSSIER_SCHEMA_VERSION,
  type DossierCollectorContext,
  type LegalDossierResult,
} from './types';

async function fetchPhotoBuffer(photoUrl: string | null): Promise<Uint8Array | null> {
  if (!photoUrl) return null;
  try {
    const res = await fetch(photoUrl);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function logExport(params: {
  projectId: string;
  employeeId: string;
  exportedBy: string | null;
  exportedByEmail: string;
  sectionIds: string[];
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('legal_dossier_exports').insert({
    project_id: params.projectId,
    employee_id: params.employeeId,
    exported_by: params.exportedBy,
    exported_by_email: params.exportedByEmail,
    schema_version: LEGAL_DOSSIER_SCHEMA_VERSION,
    section_ids: params.sectionIds,
  });
  if (error && !error.message.includes('legal_dossier_exports')) {
    console.warn('[legal-dossier] audit log:', error.message);
  }
}

export async function buildLegalDossier(params: {
  projectId: string;
  employeeId: string;
  exportedByEmail: string;
  exportedById?: string | null;
}): Promise<LegalDossierResult> {
  const admin = createAdminClient();
  const exportedAt = new Date().toISOString();

  const { data: emp, error: empError } = await admin
    .from('employees')
    .select('id, name, email, phone, position, daily_wage, hire_date, is_active, photo_url')
    .eq('id', params.employeeId)
    .eq('project_id', params.projectId)
    .maybeSingle();

  if (empError || !emp) {
    throw new Error('Personel bulunamadı');
  }

  const ctx: DossierCollectorContext = {
    admin,
    projectId: params.projectId,
    employeeId: params.employeeId,
    exportedAt,
    exportedByEmail: params.exportedByEmail,
  };

  const collectors = getDossierCollectors();
  const files = [];
  const sectionIds: string[] = [];

  for (const collector of collectors) {
    const sectionFiles = await collector.collect(ctx);
    files.push(...sectionFiles);
    sectionIds.push(collector.id);
  }

  const { data: project } = await admin
    .from('projects')
    .select('name, code, status, location, work_start_time, work_end_time')
    .eq('id', params.projectId)
    .maybeSingle();

  let sensitive: Record<string, string> | null = null;
  const { data: sensRow } = await admin
    .from('employee_sensitive_data')
    .select('tc_kimlik_enc, birth_date_enc, iban_enc')
    .eq('employee_id', params.employeeId)
    .maybeSingle();

  if (sensRow && process.env.FIELD_ENCRYPTION_KEY) {
    sensitive = {
      tcKimlik: decryptField(sensRow.tc_kimlik_enc),
      birthDate: decryptField(sensRow.birth_date_enc),
      iban: decryptField(sensRow.iban_enc),
    };
  }

  const manifest = {
    schemaVersion: LEGAL_DOSSIER_SCHEMA_VERSION,
    application: APP_NAME,
    exportedAt,
    exportedByEmail: params.exportedByEmail,
    employee: emp,
    project: project
      ? {
          ...project,
          work_hours:
            project.work_start_time || project.work_end_time
              ? `${String(project.work_start_time ?? '').slice(0, 5)} – ${String(project.work_end_time ?? '').slice(0, 5)}`
              : null,
        }
      : null,
    sensitive,
    sections: collectors.map((c) => ({ id: c.id, title: c.title })),
    extensible: true,
    note: 'Yeni modüller src/lib/legal-dossier/collectors içinde registerDossierCollector ile eklenir.',
  };

  files.unshift(jsonFile('manifest.json', manifest));
  files.push({
    path: 'OZET.html',
    content: renderDossierSummaryHtml(
      manifest,
      collectors.map((c) => ({ id: c.id, title: c.title }))
    ),
  });
  files.push({
    path: 'README.txt',
    content: [
      `${APP_NAME} — Hukuki Personel Dosyası`,
      `Personel: ${emp.name}`,
      `Dışa aktarma: ${exportedAt}`,
      `Yönetici: ${params.exportedByEmail}`,
      '',
      'İçerik:',
      '- manifest.json — dosya indeksi ve özet',
      '- OZET.html — yazdırılabilir özet',
      '- 01-profil … 09-basvuru — modül klasörleri',
      '- 08-sozlesmeler — onaylanmış sözleşme HTML kopyaları',
      '- 99-gelecek — gelecek modül alanı',
      '',
      'Kişisel verileri KVKK kapsamında koruyun.',
    ].join('\n'),
  });

  const photoBytes = await fetchPhotoBuffer(emp.photo_url);
  if (photoBytes) {
    const ext = emp.photo_url?.includes('.png')
      ? 'png'
      : emp.photo_url?.includes('.webp')
        ? 'webp'
        : 'jpg';
    files.push({ path: `01-profil/foto.${ext}`, content: photoBytes });
  }

  await logExport({
    projectId: params.projectId,
    employeeId: params.employeeId,
    exportedBy: params.exportedById ?? null,
    exportedByEmail: params.exportedByEmail,
    sectionIds,
  });

  return {
    employeeName: emp.name,
    files,
    sectionIds,
    manifest,
  };
}

export function dossierZipFilename(employeeName: string, exportedAt: string): string {
  const date = exportedAt.slice(0, 10);
  return `crewledger-hukuki-dosya-${slugifyFilename(employeeName)}-${date}.zip`;
}
