'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { AuthReportProvider, pushAuthDiagnostic } from '@/components/auth/AuthReportContext';
import { ScreenReportButton } from '@/components/auth/ScreenReportButton';
import { usePersonnelAuthPageBackground } from '@/hooks/usePersonnelAuthPageBackground';
import { APP_NAME } from '@/lib/brand';
import {
  PERSONNEL_AUTH_BG_IMAGE,
  PERSONNEL_AUTH_BG_IMAGE_DESKTOP,
  PERSONNEL_PWA_SPLASH_BG,
} from '@/lib/personnel-pwa-brand';

type AuthScreenShellProps = {
  children: React.ReactNode;
  screenLabel: string;
  panelLabel?: string;
  /** Anasayfadaki açık zemin. Yönetici girişi fotoğraf zemininde kalır. */
  tone?: 'photo' | 'home';
};

export function AuthScreenShell({
  children,
  screenLabel,
  panelLabel,
  tone = 'photo',
}: AuthScreenShellProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const home = tone === 'home';
  usePersonnelAuthPageBackground(home ? '#f7fbff' : undefined);

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
        className={`personnel-auth-page relative isolate flex min-h-[100dvh] flex-col overflow-x-hidden ${
          home ? 'personnel-auth-page--home text-slate-900' : 'text-white'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          {home ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-white" />
              <div className="absolute -top-24 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />
              <div className="absolute right-[-4rem] top-24 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />
            </>
          ) : (
            <>
              <div className="absolute inset-0" style={{ backgroundColor: PERSONNEL_PWA_SPLASH_BG }} />
              <Image
                src={PERSONNEL_AUTH_BG_IMAGE}
                alt=""
                fill
                priority
                className="object-cover object-center md:hidden"
                sizes="100vw"
              />
              <Image
                src={PERSONNEL_AUTH_BG_IMAGE_DESKTOP}
                alt=""
                fill
                priority
                className="hidden object-cover object-center md:block"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#050b1a]/60 via-transparent to-[#050b1a]/80" />
            </>
          )}
        </div>

        <header
          className={`relative z-20 flex shrink-0 items-center justify-between gap-3 safe-pt safe-px ${
            home
              ? 'border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6'
              : 'px-4 pb-2 pt-4 sm:px-6'
          }`}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark
              size="sm"
              variant="personnel"
              className={
                home
                  ? 'shrink-0 ring-1 ring-slate-200/80'
                  : 'shrink-0 shadow-lg shadow-black/40 ring-1 ring-white/10'
              }
            />
            <div className="min-w-0">
              <p
                className={
                  home
                    ? 'text-sm font-semibold tracking-tight text-[#0E1548]'
                    : 'text-sm font-semibold tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]'
                }
              >
                {home ? APP_NAME : APP_NAME.toUpperCase()}
              </p>
              {panelLabel ? (
                <p
                  className={
                    home
                      ? 'truncate text-[11px] text-slate-500'
                      : 'truncate text-[10px] font-medium uppercase tracking-[0.2em] text-sky-200/80'
                  }
                >
                  {panelLabel}
                </p>
              ) : null}
            </div>
          </Link>
          <ScreenReportButton
            captureRootRef={captureRef}
            screenLabel={screenLabel}
            tone={home ? 'home' : 'photo'}
          />
        </header>

        <div className="relative z-10 flex flex-col flex-1 min-h-0">{children}</div>
      </div>
    </AuthReportProvider>
  );
}
