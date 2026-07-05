'use client';

import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';

/** Kapanış ekranı üst marka — akış içinde, sabit değil */
export function PersonnelClosureBrandBar() {
  return (
    <div className="flex items-center gap-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3">
      <BrandMark
        size="md"
        className="shrink-0 ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-md shadow-slate-900/10"
      />
      <span className="text-lg font-bold text-[#0E1548] dark:text-white tracking-tight leading-none">
        {APP_NAME}
      </span>
    </div>
  );
}
