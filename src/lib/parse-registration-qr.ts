import { normalizeVerificationCode } from '@/lib/registration-codes';

/** QR içeriğinden başvuru kodunu çıkarır (URL veya düz ARJ-XXXXXX) */
export function parseRegistrationCodeFromQr(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const kod = url.searchParams.get('kod');
    if (kod) return normalizeVerificationCode(kod);
  } catch {
    // düz metin
  }

  const match = text.match(/ARJ-[A-Z0-9]{6}/i);
  if (match) return normalizeVerificationCode(match[0]);

  return null;
}
