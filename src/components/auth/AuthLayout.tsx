'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { usePersonnelAuthPageBackground } from '@/hooks/usePersonnelAuthPageBackground';
import {
  PERSONNEL_AUTH_BG_IMAGE,
  PERSONNEL_PWA_SPLASH_BG,
} from '@/lib/personnel-pwa-brand';
import { personnelAuthCardClass } from '@/lib/personnel-auth-ui';

type AuthLayoutProps = {
  variant: 'admin' | 'personnel';
  children: React.ReactNode;
  alternateLogin?: { href: string; label: string };
};

export function AuthLayout({ variant, children, alternateLogin }: AuthLayoutProps) {
  usePersonnelAuthPageBackground();

  return (
    <div className="personnel-auth-page relative isolate min-h-[100dvh] flex flex-col overflow-x-hidden text-white">
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

      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 safe-pt safe-px">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors touch-target py-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Ana sayfa
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 safe-pb">
        <div className="w-full max-w-md">
          <BrandLockup
            size="lg"
            layout="inline"
            className="mb-10 sm:mb-12"
            iconClassName="shadow-xl shadow-black/50 ring-1 ring-white/10"
            wordmarkClassName="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            subtitle={variant === 'admin' ? 'Yönetici Paneli' : 'Personel Paneli'}
            subtitleClassName="text-[11px] font-medium uppercase tracking-[0.24em] text-sky-200/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
          />

          <div className={`${personnelAuthCardClass} p-6 sm:p-7`}>
            {children}
          </div>

          {alternateLogin && (
            <p className="mt-5 text-center text-sm text-slate-300 px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              {variant === 'admin' ? 'Personel misiniz?' : 'Yönetici misiniz?'}{' '}
              <Link
                href={alternateLogin.href}
                className="text-sky-400 font-semibold hover:text-sky-300 hover:underline touch-target inline-flex py-1"
              >
                {alternateLogin.label}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
