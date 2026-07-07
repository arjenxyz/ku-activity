'use client';

import { useEffect } from 'react';
import { fetchPersonnelUnlockContext } from '@/lib/personnel-session-check';
import { loadPendingRegistration } from '@/lib/registration-pending-storage';
import { PERSONNEL_PWA_GRADIENT } from '@/lib/personnel-pwa-brand';
import { PERSONNEL_APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';

/**
 * TWA/PWA açılış merkezi. Kendi içeriği yoktur; oturum + kilit durumuna göre
 * tek seferde doğru ekrana yönlendirir. Böylece giriş ekranı "flash" olmaz.
 */
export default function PersonnelLaunchPage() {
  useEffect(() => {
    let cancelled = false;

    const resolveTarget = async (): Promise<string> => {
      try {
        const ctx = await fetchPersonnelUnlockContext();
        if (ctx?.unlocked) return '/personnel-panel';
        if (ctx) return '/personnel-panel/unlock';
        if (loadPendingRegistration()) return '/personnel-panel/basvuru';
      } catch {
        /* ağ hatası — girişe düş */
      }
      return '/personnel-panel/login';
    };

    void resolveTarget().then((target) => {
      if (!cancelled) window.location.replace(target);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7"
      style={{ background: PERSONNEL_PWA_GRADIENT }}
      role="status"
      aria-live="polite"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${PERSONNEL_APP_ICON}?v=${PWA_ASSET_VERSION}`}
        alt="CrewLedger"
        width={88}
        height={88}
        className="rounded-[22px] shadow-lg shadow-black/30"
      />
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white/90" />
    </div>
  );
}
