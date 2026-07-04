'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { BrandMark } from '@/components/brand/BrandMark';

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function AdminRegisterLayout({
  children,
  title,
  subtitle,
}: Props) {
  const strings = useRegistryStrings('components/auth/AdminRegisterLayout');
  const resolvedTitle = title ?? strings.defaultTitle;
  const resolvedSubtitle = subtitle ?? strings.defaultSubtitle;
  return (
    <>
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
        <div className="absolute -top-32 right-0 w-[min(500px,90vw)] h-[min(500px,90vw)] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-0 w-[min(400px,80vw)] h-[min(400px,80vw)] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col overflow-x-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 safe-pt safe-px">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <BrandMark size="sm" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
              {strings.homeLink}
            </span>
          </Link>
          <Link
            href="/admin-panel/login"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {strings.loginLink}
          </Link>
        </div>

        <div className="flex justify-center px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pt-8 sm:pb-12">
          <div className="w-full max-w-7xl">
            <div className="mb-6 text-center xl:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4 xl:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                {strings.badge}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{resolvedTitle}</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 xl:max-w-2xl">{resolvedSubtitle}</p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {strings.personnelPrompt}{' '}
              <Link
                href="/personnel-panel/login"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                {strings.personnelLoginLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
