'use client';

import { useEffect, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

const DISMISS_KEY = 'crewledger-pwa-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PersonnelPwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIos(ios);
    if (ios) {
      setHidden(false);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (hidden) return null;

  return (
    <div className="mb-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-4 flex gap-3 items-start">
      <FiDownload className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Ana ekrana ekleyin
        </p>
        <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mt-1">
          {isIos
            ? 'Safari → Paylaş → Ana Ekrana Ekle ile uygulama gibi açın.'
            : 'Sahada hızlı erişim için CrewLedger’ı telefonunuza kurun.'}
        </p>
        {!isIos && deferred && (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300 underline"
          >
            Şimdi kur
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} className="p-1 text-blue-600" aria-label="Kapat">
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
}
