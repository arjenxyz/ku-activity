import { normalizeVerificationCode } from '@/lib/registration-codes';

/** QR içeriğinden başvuru kodunu çıkarır (URL veya düz ARJ-XXXXXX) */
export function parseRegistrationCodeFromQr(raw: string): string | null {
  const text = raw.trim().replace(/\uFEFF/g, '');
  if (!text) return null;

  const kodFromQuery = (querySource: string) => {
    try {
      const params = new URLSearchParams(querySource.replace(/^\?/, ''));
      const kod = params.get('kod');
      if (kod) return normalizeVerificationCode(kod);
    } catch {
      /* */
    }
    return null;
  };

  try {
    const url = new URL(text);
    const kod = url.searchParams.get('kod');
    if (kod) return normalizeVerificationCode(kod);
  } catch {
    const queryOnly = text.includes('?') ? text.split('?').pop() ?? '' : '';
    const fromQuery = kodFromQuery(queryOnly);
    if (fromQuery) return fromQuery;
  }

  const match = text.match(/ARJ-[A-Z0-9]{6}/i);
  if (match) return normalizeVerificationCode(match[0]);

  return null;
}
