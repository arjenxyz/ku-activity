'use client';

import { FiArchive } from 'react-icons/fi';
import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

/** Proje kapanış modunda gösterilecek veri indirme ekranı */
export function PersonnelClosureScreen() {
  const { status } = usePersonnelClosure();
  const strings = useRegistryStrings('components/personnel/PersonnelClosureDossierPanel');

  return (
    <div className="relative mx-auto max-w-md w-full px-1 py-5 sm:py-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-8 h-48 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-4">
        <div className="text-center px-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0E1548] text-white shadow-lg shadow-[#0E1548]/25 mb-3">
            <FiArchive className="w-5 h-5" strokeWidth={2} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {strings.closureScreenTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            {strings.closureScreenSubtitle}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200/70 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 via-orange-50/50 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 p-5 sm:p-6 shadow-[0_12px_40px_rgba(245,158,11,0.12)]">
          <ClosureCountdown
            deadlineAt={status?.deadlineAt ?? null}
            phase={status?.phase}
            size="lg"
            variant="premium"
          />
        </div>

        <PersonnelClosureDossierPanel variant="closure" showCountdown={false} />
      </div>
    </div>
  );
}
