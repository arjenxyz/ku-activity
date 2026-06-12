'use client';

import Link from 'next/link';
import { FiLogOut } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';

type PersonnelShellProps = {
  employeeName?: string;
  position?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

export function PersonnelShell({ employeeName, position, onLogout, children }: PersonnelShellProps) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-gray-200/70 dark:border-slate-700/70 safe-pt">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <BrandMark size="sm" />
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                {APP_NAME}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                Personel Paneli
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {employeeName && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{employeeName}</p>
                {position && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{position}</p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="touch-target inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 safe-pb">{children}</main>
    </div>
  );
}
