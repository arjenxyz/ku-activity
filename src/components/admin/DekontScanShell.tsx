'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function DekontScanShell({ children }: { children: React.ReactNode }) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin-panel" className="flex min-w-0 items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              {APP_NAME}
            </span>
          </Link>
          <Link
            href="/admin-panel"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            {strings.shell.backToPanel}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
