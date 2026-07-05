'use client';

/** Bubblewrap TWA paket kimliği — client tarafında ayar intent’i için */
export const PERSONNEL_TWA_PACKAGE_ID = 'app.crewledger.personel';

const RUNTIME_STORAGE_KEY = 'crewledger-personnel-runtime';

export type PersonnelAppRuntime = 'browser' | 'pwa' | 'twa';

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function persistTwaRuntime() {
  try {
    localStorage.setItem(RUNTIME_STORAGE_KEY, 'twa');
  } catch {
    /* ignore */
  }
}

function readPersistedTwaRuntime() {
  try {
    return localStorage.getItem(RUNTIME_STORAGE_KEY) === 'twa';
  } catch {
    return false;
  }
}

/** Chrome sekmesi / PWA / Play Store APK (TWA) ayrımı */
export function detectPersonnelAppRuntime(): PersonnelAppRuntime {
  if (typeof window === 'undefined') return 'browser';

  const referrer = document.referrer;
  if (referrer.startsWith('android-app://')) {
    persistTwaRuntime();
    return 'twa';
  }

  if (readPersistedTwaRuntime()) return 'twa';

  // Android APK/TWA — referrer her açılışta gelmeyebilir; standalone ise uygulama ayarları akışı
  if (isStandaloneDisplayMode() && isAndroidDevice()) {
    persistTwaRuntime();
    return 'twa';
  }

  if (isStandaloneDisplayMode()) return 'pwa';

  return 'browser';
}

export function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/** APK/TWA — tarayıcı izin diyaloğu yerine sistem uygulama ayarları */
export function isPersonnelTwaRuntime() {
  return detectPersonnelAppRuntime() === 'twa';
}

/** Android uygulama bildirim ayarlarını aç (TWA / sideload APK) */
export function openPersonnelAppNotificationSettings() {
  if (typeof window === 'undefined') return;

  const pkg = PERSONNEL_TWA_PACKAGE_ID;
  const notificationIntent = `intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=${pkg};end`;
  const appDetailsIntent = `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;scheme=package;package=${pkg};end`;

  window.location.href = notificationIntent;

  window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = appDetailsIntent;
    }
  }, 700);
}
