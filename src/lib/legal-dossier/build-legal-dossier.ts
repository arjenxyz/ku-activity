import { createAdminClient } from '@/utils/supabase/admin';
import { decryptField } from '@/lib/field-encryption';
import { APP_NAME } from '@/lib/brand';
import './collectors';
import { getDossierCollectors } from './registry';
import { renderDossierSummaryHtml } from './render-summary-html';
import { jsonFile, slugifyFilename } from './utils';
import {
  LEGAL_DOSSIER_SCHEMA_VERSION,
  PERSONNEL_SELF_EXPORT_DAILY_LIMIT,
  type DossierCollectorContext,
  type DossierExportType,
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

async function assertPersonnelExportQuota(employeeId: string) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('legal_dossier_exports')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('export_type', 'personnel_self')
    .gte('created_at', since);

  if (error && !error.message.includes('export_type')) return;
  if ((count ?? 0) >= PERSONNEL_SELF_EXPORT_DAILY_LIMIT) {
    throw new Error(
      `Günlük indirme limitine ulaştınız (${PERSONNEL_SELF_EXPORT_DAILY_LIMIT}). Yarın tekrar deneyin.`
    );
  }
}

async function logExport(params: {
  projectId: string;
  employeeId: string;
  exportedBy: string | null;
  exportedByEmail: string;
  sectionIds: string[];
  exportType: DossierExportType;
}) {
  const admin = createAdminClient();
  const row: Record<string, unknown> = {
    project_id: params.projectId,
    employee_id: params.employeeId,
    exported_by: params.exportedBy,
    exported_by_email: params.exportedByEmail,
    schema_version: LEGAL_DOSSIER_SCHEMA_VERSION,
    section_ids: params.sectionIds,
    export_type: params.exportType,
  };

  const { error } = await admin.from('legal_dossier_exports').insert(row);
  if (error && !error.message.includes('legal_dossier_exports')) {
    console.warn('[legal-dossier] audit log:', error.message);
  }
}

const PERSONNEL_FAIRNESS_MANIFEST = {
  title: 'CrewLedger Adil Kayıt İlkeleri',
  principles: [
    'Çift onay: Her yevmiye günü yönetici kaydı ve personel onayı ile kesinleşir; tek taraflı kayıt ödemeye yansımaz.',
    'Şeffaflık: Panelde onaylı, bekleyen ve yönetici onayındaki günler ayrı görünür.',
    'Erişim hakkı (KVKK m.11): Kendi verilerinizi bu ZIP ile indirebilirsiniz.',
    'Sözleşme kanıtı: Onayladığınız sözleşmeler sürüm ve hash ile arşivlenir.',
    'İtiraz: Kayıtlarla ilgili uyuşmazlıkta yöneticiniz veya veri sorumlusuna yazılı başvurabilirsiniz.',
  ],
  dualApprovalFlow: [
    '1. Yönetici veya personel günü bildirir',
    '2. Karşı taraf onaylar',
    '3. Gün "Onaylı" olur ve maaş hesabına dahil edilir',
  ],
};

export async function buildLegalDossier(params: {
  projectId: string;
  employeeId: string;
  exportedByEmail: string;
  exportedById?: string | null;
  exportType?: DossierExportType;
}): Promise<LegalDossierResult> {
  const exportType = params.exportType ?? 'admin';

  if (exportType === 'personnel_self') {
    await assertPersonnelExportQuota(params.employeeId);
  }

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
    exportType,
  };

  const collectors = getDossierCollectors(exportType);
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
    exportType,
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
    note:
      exportType === 'personnel_self'
        ? 'Personel self-servis erişim paketi — KVKK m.11 kapsamında.'
        : 'Yönetici hukuki dosya paketi.',
  };

  files.unshift(jsonFile('manifest.json', manifest));

  if (exportType === 'personnel_self') {
    files.push(jsonFile('00-meta/adil-kayit-ilkeleri.json', PERSONNEL_FAIRNESS_MANIFEST));
  }

  files.push({
    path: 'OZET.html',
    content: renderDossierSummaryHtml(
      manifest,
      collectors.map((c) => ({ id: c.id, title: c.title })),
      exportType
    ),
  });

  const readmeLines =
    exportType === 'personnel_self'
      ? [
          `${APP_NAME} — Kayıtlarım (Personel Self-Servis)`,
          `Personel: ${emp.name}`,
          `Dışa aktarma: ${exportedAt}`,
          '',
          'Bu paket KVKK m.11 kapsamında kendi verilerinize erişim içindir.',
          'İçerik: profil, yevmiye, ödemeler, sözleşmeler, başvuru geçmişi.',
          'Çift onaylı günler "Onaylı" statüsünde maaş hesabına yansır.',
          '',
          'Dosyayı güvenli saklayın; üçüncü kişilerle paylaşmayın.',
        ]
      : [
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
          '',
          'Kişisel verileri KVKK kapsamında koruyun.',
        ];

  files.push({ path: 'README.txt', content: readmeLines.join('\n') });

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
    exportType,
  });

  return {
    employeeName: emp.name,
    files,
    sectionIds,
    manifest,
  };
}

export function dossierZipFilename(
  employeeName: string,
  exportedAt: string,
  exportType: DossierExportType = 'admin'
): string {
  const date = exportedAt.slice(0, 10);
  const slug = slugifyFilename(employeeName);
  if (exportType === 'personnel_self') {
    return `crewledger-kayitlarim-${slug}-${date}.zip`;
  }
  return `crewledger-hukuki-dosya-${slug}-${date}.zip`;
}
