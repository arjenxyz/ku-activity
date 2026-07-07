'use client';

import { TWA_ADMIN_PACKAGE_ID } from '@/lib/twa-config';

export const ADMIN_TWA_PACKAGE_ID = TWA_ADMIN_PACKAGE_ID;

const RUNTIME_STORAGE_KEY = 'crewledger-admin-runtime';

export type AdminAppRuntime = 'browser' | 'pwa' | 'twa';

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

export function detectAdminAppRuntime(): AdminAppRuntime {
  if (typeof window === 'undefined') return 'browser';

  const referrer = document.referrer;
  if (referrer.startsWith('android-app://')) {
    persistTwaRuntime();
    return 'twa';
  }

  if (readPersistedTwaRuntime()) return 'twa';

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

export function isAdminTwaRuntime() {
  return detectAdminAppRuntime() === 'twa';
}

export function openAdminAppNotificationSettings() {
  if (typeof window === 'undefined') return;

  const pkg = ADMIN_TWA_PACKAGE_ID;
  const trampoline = `intent://notification-settings/#Intent;scheme=crewledger;package=${pkg};end`;

  try {
    window.location.href = trampoline;
  } catch {
    /* ignore */
  }
}
