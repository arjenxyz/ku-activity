'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';

type PersonnelLoginLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Başvuru gibi geniş formlar için */
  size?: 'default' | 'wide';
  /** Uzun formlarda dikey ortalamayı kapatır; sayfa içeriğe göre biter */
  alignTop?: boolean;
};

export function PersonnelLoginLayout({
  children,
  title = 'Giriş yapın',
  subtitle = 'Kayıtlı e-posta ve şifreniz ile hesabınıza erişin',
  size = 'default',
  alignTop = false,
}: PersonnelLoginLayoutProps) {
  const maxWidthClass = size === 'wide' ? 'max-w-7xl' : 'max-w-md';

  return (
    <>
      {/* fixed: dekor taşması sayfa yüksekliğini şişirmez */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
        <div className="absolute -top-32 right-0 w-[min(500px,90vw)] h-[min(500px,90vw)] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-0 w-[min(400px,80vw)] h-[min(400px,80vw)] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div
        className={`relative flex flex-col overflow-x-hidden ${
          alignTop ? '' : 'min-h-[100dvh]'
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 safe-pt safe-px">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
          <BrandMark size="sm" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
              Ana sayfa
            </span>
          </Link>
        </div>

        <div
          className={`flex justify-center px-4 sm:px-6 lg:px-8 ${
            alignTop
              ? 'pt-6 pb-4 sm:pt-8 sm:pb-6'
              : 'flex-1 py-8 safe-pb items-center'
          }`}
        >
          <div className={`w-full ${maxWidthClass}`}>
            <div
              className={`mb-6 ${size === 'wide' ? 'text-center xl:text-left' : 'text-center'}`}
            >
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4 ${
                  size === 'wide' ? 'xl:mx-0' : ''
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Personel Paneli
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
              <p
                className={`mt-2 text-sm text-gray-500 dark:text-gray-400 ${
                  size === 'wide' ? 'xl:max-w-2xl' : ''
                }`}
              >
                {subtitle}
              </p>
            </div>

            <div
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 ${
                size === 'wide' ? 'p-5 sm:p-6 lg:p-8' : 'p-5 sm:p-7'
              }`}
            >
              {children}
            </div>

            <p className="mt-4 mb-0 text-center text-sm text-gray-500 dark:text-gray-400">
              Yönetici misiniz?{' '}
              <Link
                href="/admin-panel/login"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Yönetici Girişi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
