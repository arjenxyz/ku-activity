import { normalizeVerificationCode } from '@/lib/registration-codes';

const CODE_RE = /^ARJ-[A-Z0-9]{6}$/;

export function isCompleteVerificationCode(raw: string): boolean {
  return CODE_RE.test(normalizeVerificationCode(raw));
}

/** QR, URL, yapıştırma veya elle yazılan metinden başvuru kodunu çıkarır */
export function extractVerificationCode(raw: string): string | null {
  const fromQr = parseRegistrationCodeFromQr(raw);
  if (fromQr && isCompleteVerificationCode(fromQr)) return fromQr;

  const normalized = normalizeVerificationCode(raw);
  if (isCompleteVerificationCode(normalized)) return normalized;

  const compact = normalized.replace(/-/g, '');
  if (/^ARJ[A-Z0-9]{6}$/.test(compact)) {
    return `ARJ-${compact.slice(3)}`;
  }

  return null;
}

/** Admin aramasında durum mesajı — pending için null */
export function registrationStatusMessage(status: string): string | null {
  switch (status) {
    case 'pending':
      return null;
    case 'approved':
      return 'Bu başvuru zaten onaylanmış. Bu kod tekrar kullanılamaz; personel sisteme alınmış.';
    case 'rejected':
      return 'Bu başvuru reddedilmiş. Personel aynı bilgilerle yeniden başvurabilir.';
    case 'expired':
      return 'Başvuru süresi dolmuş. Personel yeni başvuru yapmalı.';
    default:
      return `Bu başvuru durumu: ${status}`;
  }
}

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
