'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiBell } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { whenPersonnelUiReady } from '@/lib/personnel-app-ready';
import { isPersonnelTwaRuntime, openPersonnelAppNotificationSettings } from '@/lib/personnel-app-runtime';
import {
  isNotificationsUnlockPersisted,
  markNotificationPromptDismissed,
  markNotificationsUnlocked,
  wasNotificationPromptDismissed,
} from '@/lib/personnel-notification-access';
import { fetchPersonnelUnlockContext } from '@/lib/personnel-session-check';
import {
  getNotificationPermission,
  registerPersonnelPushIfAuthed,
  requestNotificationPermission,
} from '@/lib/personnel-push-client';

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/unlock') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/basvuru')
  );
}

/**
 * Oturum açıldıktan sonra bildirim izni sorar.
 * TWA/APK: Android uygulama bildirim ayarlarına yönlendirir.
 */
export function PersonnelNotificationPermissionPrompt() {
  const strings = useRegistryStrings('components/personnel/PersonnelNotificationPermissionPrompt');
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const [isTwaApp, setIsTwaApp] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsTwaApp(isPersonnelTwaRuntime());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPersonnelAuthPath(pathname)) return;

    let cancelled = false;

    const maybeShow = async () => {
      if (cancelled) return;
      if (wasNotificationPromptDismissed()) return;
      if (isNotificationsUnlockPersisted()) return;

      const permission = getNotificationPermission();
      if (permission === 'granted' || isTwaApp) {
        const ok = await registerPersonnelPushIfAuthed({ twaBypassPermission: isTwaApp });
        if (ok) markNotificationsUnlocked();
        if (ok || permission === 'granted') return;
      }
      if (permission === 'unsupported') return;

      const ctx = await fetchPersonnelUnlockContext();
      if (!ctx?.unlocked) return;

      setOpen(true);
    };

    const cleanupReady = whenPersonnelUiReady(() => {
      void maybeShow();
    });
    const fallback = window.setTimeout(() => {
      void maybeShow();
    }, 12000);

    return () => {
      cancelled = true;
      cleanupReady();
      window.clearTimeout(fallback);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isTwaApp) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void registerPersonnelPushIfAuthed({ twaBypassPermission: true }).then((ok) => {
        if (ok) {
          markNotificationsUnlocked();
          setOpen(false);
        }
      });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isTwaApp]);

  const dismiss = () => {
    markNotificationPromptDismissed();
    setOpen(false);
  };

  const handleBrowserEnable = async () => {
    setBusy(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const ok = await registerPersonnelPushIfAuthed({ twaBypassPermission: isTwaApp });
        if (ok) markNotificationsUnlocked();
      }
      markNotificationPromptDismissed();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleTwaOpenSettings = () => {
    openPersonnelAppNotificationSettings();
    markNotificationPromptDismissed();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[390] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={dismiss}
        aria-label={strings.laterButton}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-prompt-title"
        className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl safe-pb sm:rounded-2xl dark:bg-slate-900"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EBF8] text-[#0E1548] dark:bg-slate-800 dark:text-white">
          <FiBell className="h-7 w-7" aria-hidden />
        </div>
        <h2
          id="notification-prompt-title"
          className="text-center text-lg font-semibold text-[#0E1548] dark:text-white"
        >
          {strings.title}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {isTwaApp ? strings.bodyTwa : strings.bodyBrowser}
        </p>
        {isTwaApp ? (
          <p className="mt-2 text-center text-xs text-slate-400">{strings.twaHint}</p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void (isTwaApp ? handleTwaOpenSettings() : handleBrowserEnable())}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E1548] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? strings.requesting
              : isTwaApp
                ? strings.openSettingsButton
                : strings.enableButton}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={dismiss}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-[#0E1548] dark:border-slate-600 dark:text-white"
          >
            {strings.laterButton}
          </button>
        </div>
      </div>
    </div>
  );
}
