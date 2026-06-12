import { APP_NAME } from '@/lib/brand';
import type { LegalDossierResult } from './types';

export function renderDossierSummaryHtml(
  manifest: LegalDossierResult['manifest'],
  sectionTitles: Array<{ id: string; title: string }>
): string {
  const exportedAt = String(manifest.exportedAt ?? '');
  const employee = manifest.employee as Record<string, unknown> | undefined;
  const project = manifest.project as Record<string, unknown> | undefined;
  const sensitive = manifest.sensitive as Record<string, unknown> | null | undefined;

  const sectionList = sectionTitles
    .map((s) => `<li><strong>${s.title}</strong> <code>${s.id}</code></li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>${APP_NAME} — Hukuki Personel Dosyası</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #0f172a; line-height: 1.5; }
    h1 { font-size: 1.5rem; color: #1e40af; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
    .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 0.5rem; }
    th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #f1f5f9; }
    th { color: #64748b; font-weight: 600; width: 38%; }
    .warn { background: #fffbeb; border: 1px solid #fde68a; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-top: 1.5rem; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${APP_NAME} — Hukuki Personel Dosyası Özeti</h1>
  <div class="meta">
    <p><strong>Dışa aktarma:</strong> ${exportedAt}</p>
    <p><strong>Şema sürümü:</strong> ${manifest.schemaVersion}</p>
    <p><strong>İndiren yönetici:</strong> ${manifest.exportedByEmail}</p>
  </div>

  <h2>Personel</h2>
  <table>
    <tr><th>Ad Soyad</th><td>${employee?.name ?? '—'}</td></tr>
    <tr><th>E-posta</th><td>${employee?.email ?? '—'}</td></tr>
    <tr><th>Telefon</th><td>${employee?.phone ?? '—'}</td></tr>
    <tr><th>Pozisyon</th><td>${employee?.position ?? '—'}</td></tr>
    <tr><th>Günlük yevmiye</th><td>${employee?.daily_wage ?? '—'} ₺</td></tr>
    <tr><th>İşe giriş</th><td>${employee?.hire_date ?? '—'}</td></tr>
    <tr><th>Durum</th><td>${employee?.is_active ? 'Aktif' : 'Pasif'}</td></tr>
  </table>

  ${
    sensitive
      ? `<h2>Hassas kimlik / ödeme</h2>
  <table>
    <tr><th>T.C. Kimlik</th><td>${sensitive.tcKimlik ?? '—'}</td></tr>
    <tr><th>Doğum tarihi</th><td>${sensitive.birthDate ?? '—'}</td></tr>
    <tr><th>IBAN</th><td>${sensitive.iban ?? '—'}</td></tr>
  </table>`
      : ''
  }

  <h2>Proje / Şantiye</h2>
  <table>
    <tr><th>Proje adı</th><td>${project?.name ?? '—'}</td></tr>
    <tr><th>Kod</th><td>${project?.code ?? '—'}</td></tr>
    <tr><th>Durum</th><td>${project?.status ?? '—'}</td></tr>
    <tr><th>Konum</th><td>${project?.location ?? '—'}</td></tr>
    <tr><th>Mesai saatleri</th><td>${project?.work_hours ?? '—'}</td></tr>
  </table>

  <h2>Dahil edilen modüller</h2>
  <ul>${sectionList}</ul>

  <div class="warn">
    Bu özet bilgilendirme amaçlıdır. Tam kayıtlar ZIP içindeki JSON/CSV/HTML dosyalarında yer alır.
    Kişisel veriler KVKK kapsamında korunmalıdır.
  </div>
</body>
</html>`;
}
