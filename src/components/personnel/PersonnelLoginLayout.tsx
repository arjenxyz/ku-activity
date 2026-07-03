'use client';

import Image from 'next/image';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { BrandMark } from '@/components/brand/BrandMark';
import { usePersonnelAuthPageBackground } from '@/hooks/usePersonnelAuthPageBackground';
import {
  PERSONNEL_AUTH_BG_IMAGE,
  PERSONNEL_PWA_SPLASH_BG,
} from '@/lib/personnel-pwa-brand';
import { personnelAuthCardClass, personnelAuthCardDividerClass } from '@/lib/personnel-auth-ui';

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
  /** dense = kısa form; dikey ortala. alignTop = uzun form; üstten başla */
  const verticalAlignTop = alignTop && !isDense;

  return (
    <div className="personnel-auth-page relative isolate min-h-[100dvh] overflow-x-hidden text-white">
      {/* Arka plan: şantiye görseli görünür kalsın; sadece okunabilirlik için hafif degrade */}
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
                : 'pt-6 pb-6 sm:pt-8 sm:pb-8 safe-pt safe-pb'
              : 'flex-1 flex items-center justify-center py-6 sm:py-10 safe-pt safe-pb'
          }`}
        >
          <div className={`w-full ${maxWidthClass}`}>
            {!isCompact && (
              <BrandLockup
                size="lg"
                layout="inline"
                className="mb-10 sm:mb-12"
                iconClassName="shadow-xl shadow-black/50 ring-1 ring-white/10"
                wordmarkClassName="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                subtitle="Personel Paneli"
                subtitleClassName="text-[11px] font-medium uppercase tracking-[0.24em] text-sky-200/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
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
                    <h1 className="text-lg sm:text-2xl font-semibold text-white leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="hidden sm:block mt-0.5 text-xs sm:text-sm text-slate-300 line-clamp-2">
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
                    ? 'p-5 sm:p-7'
                    : size === 'wide'
                      ? 'p-5 sm:p-6 lg:p-8'
                      : 'p-6 sm:p-7'
              }`}
            >
              {!isCompact && (
                <div className="mb-5 sm:mb-6">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
                  )}
                  <div className={personnelAuthCardDividerClass} />
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
