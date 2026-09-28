'use client';


import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
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
  /** Ekran raporu etiketi */
  screenLabel?: string;
};

export function PersonnelLoginLayout({
  children,
  title,
  subtitle,
  size = 'default',
  alignTop = false,
  compact = false,
  dense = false,
  screenLabel,
}: PersonnelLoginLayoutProps) {

  const strings = useRegistryStrings('components/personnel/PersonnelLoginLayout');
  const resolvedTitle = title ?? strings.defaultTitle;
  const resolvedSubtitle = subtitle ?? strings.defaultSubtitle;
  const resolvedScreenLabel = screenLabel ?? strings.defaultScreenLabel;
  const maxWidthClass = size === 'wide' ? 'max-w-3xl' : 'max-w-md';
  const isCompact = compact || (size === 'wide' && alignTop);
  const isDense = dense && !isCompact;
  const verticalAlignTop = alignTop && !isDense;

  return (
    <AuthScreenShell screenLabel={resolvedScreenLabel} panelLabel={strings.panelLabel} tone="home">
      <div
        className={`flex flex-col flex-1 ${
          verticalAlignTop ? '' : 'min-h-0'
        }`}
      >
        <div
          className={`flex justify-center px-4 sm:px-6 lg:px-8 flex-1 ${
            verticalAlignTop
              ? isCompact
                ? 'pt-2 pb-3 sm:pt-4 sm:pb-5 safe-pb'
                : 'pt-4 pb-6 sm:pt-6 sm:pb-8 safe-pb'
              : 'items-center justify-center py-4 sm:py-8 safe-pb'
          }`}
        >
          <div className={`w-full ${maxWidthClass}`}>
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
                  <h1 className="text-xl font-semibold tracking-tight text-[#0E1548]">{resolvedTitle}</h1>
                  {resolvedSubtitle && (
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{resolvedSubtitle}</p>
                  )}
                  <div className={personnelAuthCardDividerClass} />
                </div>
              )}

              {isCompact && (
                <div className="mb-4 sm:mb-5">
                  <h1 className="text-lg font-semibold tracking-tight text-[#0E1548] sm:text-xl">{resolvedTitle}</h1>
                  {resolvedSubtitle && (
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{resolvedSubtitle}</p>
                  )}
                  <div className={personnelAuthCardDividerClass} />
                </div>
              )}

              {children}
            </div>
          </div>
        </div>
      </div>
    </AuthScreenShell>
  );
}
