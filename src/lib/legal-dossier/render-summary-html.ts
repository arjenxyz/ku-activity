import { APP_NAME } from '@/lib/brand';
import { formatString } from '@/lib/strings/format';
import type { DossierExportType, LegalDossierResult } from './types';
import strings from '@json/src/lib/legal-dossier/render-summary-html.json';

export function renderDossierSummaryHtml(
  manifest: LegalDossierResult['manifest'],
  sectionTitles: Array<{ id: string; title: string }>,
  exportType: DossierExportType = 'admin'
): string {
  const exportedAt = String(manifest.exportedAt ?? '');
  const employee = manifest.employee as Record<string, unknown> | undefined;
  const project = manifest.project as Record<string, unknown> | undefined;
  const sensitive = manifest.sensitive as Record<string, unknown> | null | undefined;
  const isSelf = exportType === 'personnel_self';
  const missing = strings.missingValue;

  const sectionList = sectionTitles
    .map((s) => `<li><strong>${s.title}</strong></li>`)
    .join('');

  const title = isSelf
    ? formatString(strings.selfTitle, { appName: APP_NAME })
    : formatString(strings.adminTitle, { appName: APP_NAME });

  const exportedByLine = isSelf
    ? strings.accessTypeSelfHtml
    : formatString(strings.exportedByHtml, {
        exportedByEmail: String(manifest.exportedByEmail ?? ''),
      });

  const fairnessBlock = isSelf ? strings.fairnessBlockHtml : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #0f172a; line-height: 1.5; }
    h1 { font-size: 1.5rem; color: #1e40af; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
    .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; font-size: 0.9rem; }
    .fair { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin-top: 1rem; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 0.5rem; }
    th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #f1f5f9; }
    th { color: #64748b; font-weight: 600; width: 38%; }
    .warn { background: #fffbeb; border: 1px solid #fde68a; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-top: 1.5rem; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <p><strong>${strings.exportLabel}</strong> ${exportedAt}</p>
    <p><strong>${strings.schemaVersionLabel}</strong> ${manifest.schemaVersion}</p>
    ${exportedByLine}
  </div>

  ${fairnessBlock}

  <h2>${strings.personnelHeading}</h2>
  <table>
    <tr><th>${strings.fullNameLabel}</th><td>${employee?.name ?? missing}</td></tr>
    <tr><th>${strings.emailLabel}</th><td>${employee?.email ?? missing}</td></tr>
    <tr><th>${strings.phoneLabel}</th><td>${employee?.phone ?? missing}</td></tr>
    <tr><th>${strings.positionLabel}</th><td>${employee?.position ?? missing}</td></tr>
    <tr><th>${strings.dailyWageLabel}</th><td>${employee?.daily_wage ?? missing} ₺</td></tr>
    <tr><th>${strings.hireDateLabel}</th><td>${employee?.hire_date ?? missing}</td></tr>
    <tr><th>${strings.statusLabel}</th><td>${employee?.is_active ? strings.activeStatus : strings.inactiveStatus}</td></tr>
  </table>

  ${
    sensitive
      ? `<h2>${strings.sensitiveHeading}</h2>
  <table>
    <tr><th>${strings.tcKimlikLabel}</th><td>${sensitive.tcKimlik ?? missing}</td></tr>
    <tr><th>${strings.birthDateLabel}</th><td>${sensitive.birthDate ?? missing}</td></tr>
    <tr><th>${strings.ibanLabel}</th><td>${sensitive.iban ?? missing}</td></tr>
  </table>`
      : ''
  }

  <h2>${strings.projectHeading}</h2>
  <table>
    <tr><th>${strings.projectNameLabel}</th><td>${project?.name ?? missing}</td></tr>
    <tr><th>${strings.codeLabel}</th><td>${project?.code ?? missing}</td></tr>
    <tr><th>${strings.projectStatusLabel}</th><td>${project?.status ?? missing}</td></tr>
    <tr><th>${strings.locationLabel}</th><td>${project?.location ?? missing}</td></tr>
    <tr><th>${strings.workHoursLabel}</th><td>${project?.work_hours ?? missing}</td></tr>
  </table>

  <h2>${strings.includedRecordsHeading}</h2>
  <ul>${sectionList}</ul>

  <div class="warn">
    ${isSelf ? strings.selfWarning : strings.adminWarning}
  </div>
</body>
</html>`;
}
