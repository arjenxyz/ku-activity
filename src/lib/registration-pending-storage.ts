import { buildAdminApprovalUrl } from '@/lib/registration-codes';

const STORAGE_KEY = 'crewledger-pending-registration';
export const PENDING_REGISTRATION_COOKIE = 'crewledger-pending-app';
export const PENDING_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type PendingRegistration = {
  verificationCode: string;
  approvalUrl: string;
  reused?: boolean;
  tcKimlik?: string;
  identityType?: 'tc' | 'foreign';
  identityNumber?: string;
};

function readPendingCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${PENDING_REGISTRATION_COOKIE}=`;
  const entry = document.cookie.split('; ').find((row) => row.startsWith(prefix));
  if (!entry) return null;
  const value = decodeURIComponent(entry.slice(prefix.length)).trim();
  if (!value || value === '1') return null;
  return value;
}

function setPendingCookie(code: string | null) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  if (code) {
    document.cookie = `${PENDING_REGISTRATION_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${PENDING_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${PENDING_REGISTRATION_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
  }
}

/** Sunucu tarafı pending çerezi (middleware ile uyumlu) */
export function pendingRegistrationCookieOptions(active: boolean) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: active ? PENDING_COOKIE_MAX_AGE : 0,
  };
}

export function pendingRegistrationFromCode(
  verificationCode: string,
  extra?: Pick<PendingRegistration, 'identityType' | 'identityNumber' | 'tcKimlik'>
): PendingRegistration {
  return {
    verificationCode,
    approvalUrl: buildAdminApprovalUrl(verificationCode),
    ...extra,
    tcKimlik: extra?.tcKimlik ?? (extra?.identityType === 'tc' ? extra?.identityNumber : undefined),
  };
}

export function savePendingRegistration(data: PendingRegistration) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setPendingCookie(data.verificationCode);
  } catch {
    setPendingCookie(data.verificationCode);
  }
}

export function loadPendingRegistration(): PendingRegistration | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PendingRegistration;
      if (parsed.verificationCode && parsed.approvalUrl) {
        return parsed;
      }
    }
  } catch {
    /* localStorage bozuksa çerezden dene */
  }

  const code = readPendingCodeFromCookie();
  if (!code) return null;
  return pendingRegistrationFromCode(code);
}

export function hasLegacyPendingCookieFlag(): boolean {
  if (typeof document === 'undefined') return false;
  const prefix = `${PENDING_REGISTRATION_COOKIE}=`;
  const entry = document.cookie.split('; ').find((row) => row.startsWith(prefix));
  return entry?.slice(prefix.length).trim() === '1';
}

export function clearPendingRegistration() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* */
  }
  setPendingCookie(null);
}
