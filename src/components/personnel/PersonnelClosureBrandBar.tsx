'use client';

import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';

/** Kapanış modunda üst sol marka — personel mobil header yerine */
export function PersonnelClosureBrandBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 sm:static sm:z-auto border-b border-slate-200/70 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md safe-pt">
      <div className="flex h-[3.25rem] sm:h-14 items-center gap-3 px-4 max-w-lg mx-auto sm:max-w-none sm:px-0">
        <BrandMark
          size="md"
          className="shrink-0 ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-md shadow-slate-900/10"
        />
        <span className="text-[17px] sm:text-lg font-bold text-[#0E1548] dark:text-white tracking-tight leading-none">
          {APP_NAME}
        </span>
      </div>
    </header>
  );
}
