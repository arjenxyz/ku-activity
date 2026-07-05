'use client';

import { PersonnelClosureBrandBar } from './PersonnelClosureBrandBar';
import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';

/** Proje kapanış modunda veri indirme ekranı */
export function PersonnelClosureScreen() {
  const { status } = usePersonnelClosure();

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-8">
      <PersonnelClosureBrandBar />

      <div className="mt-2 flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_48px_rgba(14,21,72,0.1)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30">
        <div className="bg-gradient-to-b from-amber-50/90 via-orange-50/30 to-white px-4 py-6 sm:px-6 sm:py-7 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900">
          <ClosureCountdown
            deadlineAt={status?.deadlineAt ?? null}
            phase={status?.phase}
            size="lg"
            variant="premium"
            showTitle={false}
          />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

        <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6">
          <PersonnelClosureDossierPanel variant="closure" embedded showCountdown={false} showDailyLimit={false} />
        </div>
      </div>
    </div>
  );
}
