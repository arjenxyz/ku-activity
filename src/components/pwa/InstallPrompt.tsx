'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

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

export function InstallPrompt() {
  const pathname = usePathname() ?? '';
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isPersonnelContext =
    pathname.startsWith('/personnel-panel') || pathname === '/';

  useEffect(() => {
    if (!isPersonnelContext) return;
    if (isStandalone()) return;

    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

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
  }, [isPersonnelContext]);

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
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

  if (!isPersonnelContext || dismissed || isStandalone()) return null;
  if (!deferredPrompt && !showIOSHint) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      role="region"
      aria-label="Uygulamayı yükle"
    >
      <div className="mx-auto max-w-lg pointer-events-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex gap-3 items-start">
        <BrandMark size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Install CrewLedger</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            {showIOSHint
              ? 'Safari\'de Paylaş düğmesine basın, ardından "Ana Ekrana Ekle" seçin.'
              : 'Hızlı erişim için ana ekranınıza ekleyin.'}
          </p>
          <div className="flex gap-2 mt-3">
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="text-xs font-semibold bg-blue-600 text-white px-4 py-2.5 rounded-xl min-h-[44px]"
              >
                Yükle
              </button>
            )}
            <button
              onClick={dismiss}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2.5 rounded-xl min-h-[44px]"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
