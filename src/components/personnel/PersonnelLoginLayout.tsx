'use client';

import Image from 'next/image';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  PERSONNEL_AUTH_BG_IMAGE,
  PERSONNEL_PWA_SPLASH_BG,
} from '@/lib/personnel-pwa-brand';

type PersonnelLoginLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Başvuru gibi geniş formlar için */
  size?: 'default' | 'wide';
  /** Uzun formlarda dikey ortalamayı kapatır; sayfa içeriğe göre biter */
  alignTop?: boolean;
  /** Mobilde üst alanı sadeleştirir (başvuru vb.) */
  compact?: boolean;
};

export function PersonnelLoginLayout({
  children,
  title = 'Giriş yapın',
  subtitle = 'Kayıtlı e-posta ve şifreniz ile hesabınıza erişin',
  size = 'default',
  alignTop = false,
  compact = false,
}: PersonnelLoginLayoutProps) {
  const maxWidthClass = size === 'wide' ? 'max-w-7xl' : 'max-w-md';
  const isCompact = compact || (size === 'wide' && alignTop);

  return (
    <>
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{ backgroundColor: PERSONNEL_PWA_SPLASH_BG }} />
        <Image
          src={PERSONNEL_AUTH_BG_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0b1624]/25" />
      </div>

      <div
        className={`relative flex flex-col overflow-x-hidden ${
          alignTop ? '' : 'min-h-[100dvh]'
        }`}
      >
        {!isCompact && (
          <div className="flex items-center justify-center px-4 sm:px-6 pt-4 sm:pt-6 safe-pt safe-px">
            <div className="inline-flex items-center gap-2.5">
              <BrandMark size="sm" />
              <span className="text-sm font-semibold tracking-wide text-white/90">
                CREWLEDGER
              </span>
            </div>
          </div>
        )}

        <div
          className={`flex justify-center px-4 sm:px-6 lg:px-8 ${
            alignTop
              ? isCompact
                ? 'pt-3 pb-3 sm:pt-6 sm:pb-5 safe-pt safe-pb'
                : 'pt-6 pb-4 sm:pt-8 sm:pb-6'
              : 'flex-1 py-8 safe-pb items-center'
          }`}
        >
          <div className={`w-full ${maxWidthClass}`}>
            <div
              className={`${
                isCompact ? 'mb-3 sm:mb-5' : 'mb-6'
              } ${size === 'wide' ? 'text-center xl:text-left' : 'text-center'}`}
            >
              {isCompact ? (
                <div className="flex items-center justify-center gap-2.5 sm:justify-start xl:justify-start">
                  <BrandMark size="sm" />
                  <div className="min-w-0 text-left">
                    <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="hidden sm:block mt-0.5 text-xs sm:text-sm text-white/70 line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sky-200 text-sm font-medium mb-4 backdrop-blur-sm ${
                      size === 'wide' ? 'xl:mx-0' : ''
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                    </span>
                    Personel Paneli
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
                  <p
                    className={`mt-2 text-sm text-white/70 ${
                      size === 'wide' ? 'xl:max-w-2xl' : ''
                    }`}
                  >
                    {subtitle}
                  </p>
                </>
              )}
            </div>

            <div
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-black/30 border border-white/10 dark:border-slate-700 ${
                isCompact ? 'p-4 sm:p-6 lg:p-8' : size === 'wide' ? 'p-5 sm:p-6 lg:p-8' : 'p-5 sm:p-7'
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
