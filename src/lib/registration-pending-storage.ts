const STORAGE_KEY = 'arjendev-pending-registration';

export type PendingRegistration = {
  verificationCode: string;
  approvalUrl: string;
  reused?: boolean;
};

export function savePendingRegistration(data: PendingRegistration) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
  } catch {
    /* */
  }
}
