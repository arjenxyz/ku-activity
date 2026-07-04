/**
 * Bubblewrap keystore SHA-256 parmak izleri (Digital Asset Links).
 * Vercel env ile birleştirilir — APK imzası bunlardan biriyle eşleşmeli.
 *
 * Güncellemek: npm run twa:fingerprint
 */
export const TWA_PERSONNEL_SHA256_DEFAULTS = [
  // twa-build/personel/android.keystore (release APK imzası)
  'D1:6F:0B:CB:89:26:47:CA:E2:FA:4F:9B:78:3A:D6:DA:55:D6:B3:CC:59:43:39:E0:67:3D:8D:57:97:09:AB:8A',
] as const;

/** Admin TWA — personel ile aynı keystore (sideload dağıtım) */
export const TWA_ADMIN_SHA256_DEFAULTS = [
  'D1:6F:0B:CB:89:26:47:CA:E2:FA:4F:9B:78:3A:D6:DA:55:D6:B3:CC:59:43:39:E0:67:3D:8D:57:97:09:AB:8A',
] as const;

function mergeFingerprints(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const fp of group) {
      const normalized = fp.trim().toUpperCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}

export function personnelSha256Fingerprints(envFingerprints: string[]) {
  return mergeFingerprints([...TWA_PERSONNEL_SHA256_DEFAULTS], envFingerprints);
}

export function adminSha256Fingerprints(envFingerprints: string[]) {
  return mergeFingerprints([...TWA_ADMIN_SHA256_DEFAULTS], envFingerprints);
}
