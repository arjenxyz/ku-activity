'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { AuthReportProvider, pushAuthDiagnostic } from '@/components/auth/AuthReportContext';
import { ScreenReportButton } from '@/components/auth/ScreenReportButton';
import { usePersonnelAuthPageBackground } from '@/hooks/usePersonnelAuthPageBackground';
import {
  PERSONNEL_AUTH_BG_IMAGE,
  PERSONNEL_PWA_SPLASH_BG,
} from '@/lib/personnel-pwa-brand';

type AuthScreenShellProps = {
  children: React.ReactNode;
  screenLabel: string;
  panelLabel?: string;
};

export function AuthScreenShell({ children, screenLabel, panelLabel }: AuthScreenShellProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  usePersonnelAuthPageBackground();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      pushAuthDiagnostic(`JS: ${event.message}`);
    };
    const onReject = (event: PromiseRejectionEvent) => {
      const msg =
        event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'unknown');
      pushAuthDiagnostic(`Promise: ${msg}`);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
  }, []);

  return (
    <AuthReportProvider>
      <div
        ref={captureRef}
        className="personnel-auth-page relative isolate min-h-[100dvh] overflow-x-hidden text-white flex flex-col"
      >
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute inset-0" style={{ backgroundColor: PERSONNEL_PWA_SPLASH_BG }} />
          <Image
            src={PERSONNEL_AUTH_BG_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050b1a]/60 via-transparent to-[#050b1a]/80" />
        </div>

        <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 pt-4 pb-2 safe-pt safe-px shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size="sm" className="shadow-lg shadow-black/40 ring-1 ring-white/10 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                CREWLEDGER
              </p>
              {panelLabel ? (
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sky-200/80 truncate">
                  {panelLabel}
                </p>
              ) : null}
            </div>
          </div>
          <ScreenReportButton captureRootRef={captureRef} screenLabel={screenLabel} />
        </header>

        <div className="relative z-10 flex flex-col flex-1 min-h-0">{children}</div>
      </div>
    </AuthReportProvider>
  );
}
