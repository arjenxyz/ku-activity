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

function setPendingCookie(active: boolean) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  if (active) {
    document.cookie = `${PENDING_REGISTRATION_COOKIE}=1; path=/; max-age=${PENDING_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
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

export function savePendingRegistration(data: PendingRegistration) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setPendingCookie(true);
  } catch {
    /* private mode / quota */
  }
}

export function loadPendingRegistration(): PendingRegistration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingRegistration;
    if (!parsed.verificationCode || !parsed.approvalUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingRegistration() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    setPendingCookie(false);
  } catch {
    /* */
  }
}
