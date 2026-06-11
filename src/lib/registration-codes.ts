const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateVerificationCode() {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `ARJ-${suffix}`;
}

export function normalizeVerificationCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function buildAdminApprovalUrl(code: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/admin-panel/basvuru-onay?kod=${encodeURIComponent(code)}`;
}
