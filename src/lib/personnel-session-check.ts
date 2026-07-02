/** PWA yeniden açılışında geçerli oturum var mı (cookie + sunucu doğrulaması) */
export async function hasActivePersonnelSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/personnel/me', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function redirectToPersonnelPanel() {
  window.location.replace('/personnel-panel');
}

export function redirectToPendingApplication() {
  window.location.replace('/personnel-panel/basvuru');
}
