'use client';

import { PersonnelClosureBrandBar } from './PersonnelClosureBrandBar';
import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate } from '@/lib/format';
import { formatString } from '@/lib/strings/format';

/** Proje kapanış modunda veri indirme ekranı */
export function PersonnelClosureScreen() {
  const { status } = usePersonnelClosure();
  const strings = useRegistryStrings('components/personnel/PersonnelClosureScreen');
  const deletionDate = status?.deadlineAt ? formatDate(status.deadlineAt) : null;

  return (
    <div className="mx-auto w-full max-w-md flex-col px-4 pb-8 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <PersonnelClosureBrandBar />

      <div className="mt-2 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_48px_rgba(14,21,72,0.1)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30">
        <div className="bg-gradient-to-b from-amber-50/90 via-orange-50/30 to-white px-4 py-6 sm:px-6 sm:py-7 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900">
          {deletionDate ? (
            <p className="mb-4 text-center text-sm font-semibold leading-snug text-slate-700 dark:text-slate-200">
              {formatString(strings.accountDeletionNote, { date: deletionDate })}
            </p>
          ) : null}
          <ClosureCountdown
            deadlineAt={status?.deadlineAt ?? null}
            phase={status?.phase}
            size="lg"
            variant="premium"
            showTitle={false}
          />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <PersonnelClosureDossierPanel variant="closure" embedded showCountdown={false} showDailyLimit={false} />
        </div>
      </div>
    </div>
  );
}
