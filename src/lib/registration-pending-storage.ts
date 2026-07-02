const STORAGE_KEY = 'crewledger-pending-registration';
export const PENDING_REGISTRATION_COOKIE = 'crewledger-pending-app';

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
  if (active) {
    document.cookie = `${PENDING_REGISTRATION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    document.cookie = `${PENDING_REGISTRATION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
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
