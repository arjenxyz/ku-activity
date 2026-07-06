/** Oturum + kilit durumu */
export async function fetchPersonnelUnlockContext(): Promise<{
  unlocked: boolean;
  firstName: string;
  fullName: string;
} | null> {
  try {
    const res = await fetch('/api/auth/personnel/unlock', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return (await res.json()) as {
      unlocked: boolean;
      firstName: string;
      fullName: string;
    };
  } catch {
    return null;
  }
}

export function redirectToPersonnelUnlock() {
  window.location.replace('/personnel-panel/unlock');
}

export function redirectToPersonnelPanel() {
  window.location.replace('/personnel-panel');
}

export function redirectToPendingApplication() {
  window.location.replace('/personnel-panel/basvuru');
}

/** @deprecated fetchPersonnelUnlockContext kullanın */
export async function hasActivePersonnelSession(): Promise<boolean> {
  const ctx = await fetchPersonnelUnlockContext();
  return Boolean(ctx?.unlocked);
}
