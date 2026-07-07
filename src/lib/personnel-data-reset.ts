'use client';

/**
 * CrewLedger'ın bu cihazdaki tüm istemci verisini temizler — yalnızca bu origin
 * (crewledger.vercel.app). Kullanıcının tarayıcısındaki diğer sitelerin verisine
 * veya genel Chrome geçmişine dokunmaz.
 *
 * httpOnly oturum çerezi JS'den silinemez; bu yüzden çağıran taraf ayrıca
 * sunucu logout uç noktasını çağırmalıdır.
 */
export async function clearPersonnelClientData(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1) Service worker kayıtlarını kaldır (eski PWA kabuğu/önbellek mantığı)
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    /* yoksay */
  }

  // 2) Cache Storage (PWA önbelleği)
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* yoksay */
  }

  // 3) IndexedDB
  try {
    const idb = window.indexedDB;
    if (idb && typeof idb.databases === 'function') {
      const dbs = await idb.databases();
      await Promise.all(
        dbs.map((db) =>
          db.name
            ? new Promise<void>((resolve) => {
                const req = idb.deleteDatabase(db.name as string);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              })
            : Promise.resolve()
        )
      );
    }
  } catch {
    /* yoksay */
  }

  // 4) localStorage / sessionStorage
  try {
    localStorage.clear();
  } catch {
    /* yoksay */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* yoksay */
  }

  // 5) Erişilebilir (httpOnly olmayan) çerezleri sil
  try {
    for (const entry of document.cookie.split(';')) {
      const name = entry.split('=')[0]?.trim();
      if (!name) continue;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  } catch {
    /* yoksay */
  }
}
