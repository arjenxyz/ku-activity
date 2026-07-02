'use client';

import Image from 'next/image';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { BrandMark } from '@/components/brand/BrandMark';
import { usePersonnelAuthPageBackground } from '@/hooks/usePersonnelAuthPageBackground';
import {
  PERSONNEL_AUTH_BG_IMAGE,
  PERSONNEL_PWA_SPLASH_BG,
} from '@/lib/personnel-pwa-brand';
import { personnelAuthCardClass } from '@/lib/personnel-auth-ui';

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
  /** Giriş gibi kısa formlar — daha az boşluk, üstten hizalı */
  dense?: boolean;
};

export function PersonnelLoginLayout({
  children,
  title = 'Giriş yapın',
  subtitle = 'Kayıtlı e-posta ve şifreniz ile hesabınıza erişin',
  size = 'default',
  alignTop = false,
  compact = false,
  dense = false,
}: PersonnelLoginLayoutProps) {
  usePersonnelAuthPageBackground();

  const maxWidthClass = size === 'wide' ? 'max-w-7xl' : 'max-w-md';
  const isCompact = compact || (size === 'wide' && alignTop);
  const isDense = dense && !isCompact;
  const verticalAlignTop = alignTop || isDense;

  return (
    <div className="relative isolate min-h-[100dvh] overflow-x-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{ backgroundColor: PERSONNEL_PWA_SPLASH_BG }} />
        <Image
          src={PERSONNEL_AUTH_BG_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1624]/88 via-[#0b1624]/78 to-[#060d14]/92" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,13,20,0.55)_100%)]" />
      </div>

      <div
        className={`relative z-10 flex flex-col ${
          verticalAlignTop ? '' : 'min-h-[100dvh]'
        }`}
      >
        <div
          className={`flex justify-center px-4 sm:px-6 lg:px-8 ${
            verticalAlignTop
              ? isCompact
                ? 'pt-3 pb-3 sm:pt-6 sm:pb-5 safe-pt safe-pb'
                : isDense
                  ? 'pt-5 pb-5 sm:pt-6 sm:pb-6 safe-pt safe-pb'
                  : 'pt-6 pb-4 sm:pt-8 sm:pb-6'
              : 'flex-1 py-8 safe-pb items-center'
          }`}
        >
          <div className={`w-full ${maxWidthClass}`}>
            {!isCompact && (
              <BrandLockup
                size="lg"
                layout={isDense ? 'stacked' : 'inline'}
                className={isDense ? 'mb-4' : 'mb-6 sm:mb-7'}
                iconClassName="shadow-xl shadow-black/40"
                wordmarkClassName="text-white/95"
                subtitle="Personel Girişi"
                subtitleClassName="text-[10px] font-medium uppercase tracking-[0.28em] text-white/40"
              />
            )}

            {isCompact && (
              <div
                className={`mb-3 sm:mb-5 ${
                  size === 'wide' ? 'text-center xl:text-left' : 'text-center'
                }`}
              >
                <div className="flex items-center justify-center gap-2.5 sm:justify-start xl:justify-start">
                  <BrandMark size="sm" />
                  <div className="min-w-0 text-left">
                    <h1 className="text-lg sm:text-2xl font-semibold text-white leading-tight">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="hidden sm:block mt-0.5 text-xs sm:text-sm text-white/55 line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`${personnelAuthCardClass} ${
                isCompact
                  ? 'p-4 sm:p-6 lg:p-8'
                  : isDense
                    ? 'p-5 sm:p-6'
                    : size === 'wide'
                      ? 'p-5 sm:p-6 lg:p-8'
                      : 'p-6 sm:p-7'
              }`}
            >
              {!isCompact && (
                <div
                  className={
                    isDense
                      ? 'border-b border-white/[0.08] pb-3 mb-4'
                      : 'border-b border-white/[0.08] pb-5 mb-6'
                  }
                >
                  <h1
                    className={
                      isDense
                        ? 'text-lg font-semibold text-white tracking-tight'
                        : 'text-xl sm:text-2xl font-semibold text-white tracking-tight'
                    }
                  >
                    {title}
                  </h1>
                  {subtitle && (
                    <p
                      className={
                        isDense
                          ? 'mt-1 text-xs text-white/50 leading-snug'
                          : 'mt-1.5 text-sm text-white/55 leading-relaxed'
                      }
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
