'use client';

import { useCallback, useEffect, useState } from 'react';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { RegistrationQrCode } from '@/components/registration/RegistrationQrCode';
import strings from '@json/src/components/personnel/PendingApplicationWaitingScreen.json';

type Props = {
  approvalUrl: string;
  verificationCode: string;
  onSignOut: () => void;
};

function useQrSize() {
  const [size, setSize] = useState(260);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setSize(Math.min(288, Math.max(220, Math.floor(w * 0.72))));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

export function PendingApplicationWaitingScreen({
  approvalUrl,
  verificationCode,
  onSignOut,
}: Props) {
  const qrSize = useQrSize();
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pano izni yoksa sessizce geç */
    }
  }, [verificationCode]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600 via-blue-500 to-indigo-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
      </div>

      <div className="flex flex-1 flex-col px-4 pt-5 pb-6 safe-pt safe-pb max-w-md mx-auto w-full">
        <BrandLockup
          size="sm"
          className="mb-5"
          iconClassName="ring-2 ring-white/30"
          wordmarkClassName="text-white/95 font-semibold"
        />

        <div className="flex flex-1 flex-col justify-center">
          <div className="rounded-3xl bg-white shadow-2xl shadow-blue-950/25 overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                {strings.badge}
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {strings.instruction}
              </p>
            </div>

            <div className="px-5 py-6 flex flex-col items-center gap-6">
              <RegistrationQrCode
                value={approvalUrl}
                size={qrSize}
                className="w-full max-w-[288px] h-auto rounded-2xl border-0 shadow-inner ring-1 ring-slate-100"
              />

              <button
                type="button"
                onClick={() => void copyCode()}
                className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-center active:scale-[0.98] transition-transform touch-manipulation"
                aria-label={strings.copyAriaLabel}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {strings.codeLabel}
                </p>
                <p className="mt-2 text-2xl font-bold font-mono text-white tracking-[0.12em] break-all">
                  {verificationCode}
                </p>
                <p className="mt-2 text-[11px] font-medium text-slate-400">
                  {copied ? strings.copied : strings.tapToCopy}
                </p>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/80">
          {strings.autoUpdateHint}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 w-full py-3 text-center text-xs font-medium text-white/70 hover:text-white"
        >
          {strings.signOut}
        </button>
      </div>
    </div>
  );
}
