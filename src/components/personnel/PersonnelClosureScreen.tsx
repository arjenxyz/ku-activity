'use client';

import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';

/** Proje kapanış modunda gösterilecek veri indirme ekranı */
export function PersonnelClosureScreen() {
  const { status } = usePersonnelClosure();

  return (
    <div className="mx-auto max-w-lg space-y-5 px-1 py-4 sm:py-6">
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/90 dark:bg-amber-950/30 p-5 sm:p-6">
        <ClosureCountdown
          deadlineAt={status?.deadlineAt ?? null}
          phase={status?.phase}
          size="lg"
        />
      </div>
      <PersonnelClosureDossierPanel variant="closure" showCountdown={false} />
    </div>
  );
}
