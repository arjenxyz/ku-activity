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
  fetchPushSubscriptionStatus,
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
 * TWA/APK: Android ayarları + requestPermission ile WebView iznini senkronize eder.
 */
export function PersonnelNotificationPermissionPrompt() {
  const strings = useRegistryStrings('components/personnel/PersonnelNotificationPermissionPrompt');
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const [isTwaApp, setIsTwaApp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [awaitingSettings, setAwaitingSettings] = useState(false);

  useEffect(() => {
    setIsTwaApp(isPersonnelTwaRuntime());
  }, []);

  const tryRegisterAndClose = async (twaAfterSettings = false) => {
    const ok = await registerPersonnelPushIfAuthed({
      force: twaAfterSettings,
      twaBypassPermission: isTwaApp || twaAfterSettings,
    });
    if (ok) {
      markNotificationsUnlocked();
      setOpen(false);
      setAwaitingSettings(false);
    }
    return ok;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPersonnelAuthPath(pathname)) return;

    let cancelled = false;

    const maybeShow = async () => {
      if (cancelled) return;
      if (wasNotificationPromptDismissed()) return;
      if (isNotificationsUnlockPersisted()) return;

      const status = await fetchPushSubscriptionStatus();
      if (status?.currentSessionSubscribed) {
        markNotificationsUnlocked();
        return;
      }

      const permission = getNotificationPermission();
      if (permission === 'granted') {
        const ok = await tryRegisterAndClose();
        if (ok) return;
      }

      if (isTwaApp) {
        const ok = await tryRegisterAndClose(true);
        if (ok) return;
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
  }, [pathname, isTwaApp]);

  useEffect(() => {
    if (!isTwaApp) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void (async () => {
        await requestNotificationPermission({ twaAfterSettings: true });
        const ok = await tryRegisterAndClose(true);
        if (ok) setAwaitingSettings(false);
      })();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isTwaApp, awaitingSettings]);

  const dismiss = () => {
    markNotificationPromptDismissed();
    setOpen(false);
    setAwaitingSettings(false);
  };

  const handleBrowserEnable = async () => {
    setBusy(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        await tryRegisterAndClose();
      }
      markNotificationPromptDismissed();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleTwaOpenSettings = () => {
    setAwaitingSettings(true);
    openPersonnelAppNotificationSettings();
  };

  const handleTwaConfirm = async () => {
    setBusy(true);
    try {
      await requestNotificationPermission({ twaAfterSettings: true });
      const ok = await tryRegisterAndClose(true);
      if (ok) {
        markNotificationPromptDismissed();
      }
    } finally {
      setBusy(false);
    }
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
        {isTwaApp && awaitingSettings ? (
          <p className="mt-3 text-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {strings.twaAwaitingSettings}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          {isTwaApp ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handleTwaOpenSettings}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E1548] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {strings.openSettingsButton}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleTwaConfirm()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0E1548]/20 bg-[#E8EBF8] px-5 py-2.5 text-sm font-semibold text-[#0E1548] disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {busy ? strings.requesting : strings.confirmSettingsButton}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleBrowserEnable()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E1548] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? strings.requesting : strings.enableButton}
            </button>
          )}
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
