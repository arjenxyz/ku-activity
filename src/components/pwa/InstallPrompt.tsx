'use client';

import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { usePathname } from 'next/navigation';
import { FiShare, FiSmartphone, FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { PERSONNEL_PWA_THEME } from '@/lib/personnel-pwa-brand';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'crewledger-pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/basvuru') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum')
  );
}

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return raw === '1';
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {

  const strings = useRegistryStrings('components/pwa/InstallPrompt');
  const pathname = usePathname() ?? '';
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isPersonnelContext =
    pathname.startsWith('/personnel-panel') || pathname === '/';

  const visible =
    mounted &&
    isPersonnelContext &&
    !isPersonnelAuthPath(pathname) &&
    !dismissed &&
    !isStandalone() &&
    (Boolean(deferredPrompt) || showIOSHint);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isPersonnelContext || isPersonnelAuthPath(pathname)) return;
    if (isStandalone()) return;

    if (isDismissedRecently()) {
      setDismissed(true);
      return;
    }

    setDismissed(false);

    if (isIOS()) {
      setShowIOSHint(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, [isPersonnelContext, pathname]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSHint(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      role="region"
      aria-label={strings.regionAriaLabel}
    >
      <div
        className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.35)]"
        style={{ background: `linear-gradient(165deg, ${PERSONNEL_PWA_THEME} 0%, #0b1624 100%)` }}
      >
        <div className="relative px-4 pt-4 pb-4">
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-3 right-3 rounded-lg p-2 text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors"
            aria-label={strings.closeAriaLabel}
          >
            <FiX className="h-4 w-4" />
          </button>

          <div className="flex gap-3 pr-8">
            <BrandMark size="lg" className="ring-1 ring-white/15 shadow-lg shrink-0" />
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200/75">
                {strings.brandLabel}
              </p>
              <p className="mt-1 text-base font-semibold text-white leading-snug">
                {strings.title}
              </p>
              <p className="mt-1.5 text-xs text-sky-100/75 leading-relaxed">
                {showIOSHint ? (
                  <>
                    {strings.iosHintPrefix}{' '}
                    <span className="inline-flex items-center gap-0.5 font-medium text-white">
                      <FiShare className="h-3 w-3" aria-hidden />
                      {strings.iosShare}
                    </span>{' '}
                    {strings.iosHintSuffix}{' '}
                    <strong className="text-white font-medium">{strings.iosAddToHome}</strong>
                  </>
                ) : (
                  strings.androidHint
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-white text-[#163a5c] text-sm font-semibold shadow-md hover:bg-sky-50 transition-colors"
              >
                <FiSmartphone className="h-4 w-4" aria-hidden />
                {strings.installButton}
              </button>
            ) : showIOSHint ? (
              <div className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs text-sky-100/90 leading-relaxed">
                {strings.iosSafariNote}
              </div>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 min-h-[44px] px-4 rounded-xl border border-white/15 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
            >
              {strings.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
