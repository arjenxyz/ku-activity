import { DEFAULT_APP_URL } from '@/lib/brand';

/** Google Play TWA paket kimlikleri (Bubblewrap ile aynı olmalı) */
export const TWA_PERSONNEL_PACKAGE_ID =
  process.env.TWA_PERSONNEL_PACKAGE_ID?.trim() || 'app.crewledger.personel';

export const TWA_ADMIN_PACKAGE_ID =
  process.env.TWA_ADMIN_PACKAGE_ID?.trim() || 'app.crewledger.admin';

export function getTwaOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.TWA_HOST?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      return DEFAULT_APP_URL;
    }
  }
  return DEFAULT_APP_URL;
}

/** SHA-256 parmak izleri — virgülle ayrılmış (debug + Play imza) */
export function parseSha256Fingerprints(envValue: string | undefined): string[] {
  if (!envValue?.trim()) return [];
  return envValue
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export const TWA_PERSONNEL_SHA256 = parseSha256Fingerprints(
  process.env.TWA_PERSONNEL_SHA256_FINGERPRINTS
);

export const TWA_ADMIN_SHA256 = parseSha256Fingerprints(
  process.env.TWA_ADMIN_SHA256_FINGERPRINTS
);
