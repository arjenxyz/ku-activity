'use client';

import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';

/** Proje kapanış modunda gösterilecek veri indirme ekranı */
export function PersonnelClosureScreen() {
  const { status } = usePersonnelClosure();

  return (
    <div className="relative mx-auto max-w-md w-full px-1 pb-6 sm:pb-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-4 h-40 rounded-full bg-amber-200/25 dark:bg-amber-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-4 pt-1 sm:pt-2">
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
