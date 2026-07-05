import { SignJWT, importPKCS8 } from 'jose';

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

export function isGoogleServiceAccountConfigured(): boolean {
  return Boolean(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim());
}

export function parseGoogleServiceAccountJson() {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON tanımlı değil');
  }
  const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(text) as ServiceAccount;
}

export async function getGoogleServiceAccountToken(scopes: string[]) {
  const sa = parseGoogleServiceAccountJson();
  const key = await importPKCS8(sa.private_key.replace(/\\n/g, '\n'), 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: scopes.join(' ') })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || 'Google erişim tokeni alınamadı');
  }
  return data.access_token;
}

export async function getGoogleDriveToken() {
  return getGoogleServiceAccountToken(['https://www.googleapis.com/auth/drive.file']);
}

export async function getGoogleVisionToken() {
  return getGoogleServiceAccountToken(['https://www.googleapis.com/auth/cloud-vision']);
}
