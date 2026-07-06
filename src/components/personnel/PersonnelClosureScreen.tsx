'use client';

import { useCallback, useMemo, useState } from 'react';
import { PersonnelClosureBrandBar } from './PersonnelClosureBrandBar';
import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';
import { AcceleratedClosureCountdown } from './AcceleratedClosureCountdown';
import { PersonnelClosureAccelerationPanel } from './PersonnelClosureAccelerationPanel';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate } from '@/lib/format';
import { formatString } from '@/lib/strings/format';

/** Proje kapanış modunda veri indirme ekranı */
export function PersonnelClosureScreen() {
  const { status, reload } = usePersonnelClosure();
  const strings = useRegistryStrings('components/personnel/PersonnelClosureScreen');
  const accelStrings = useRegistryStrings('components/personnel/PersonnelClosureAcceleration');
  const [accelerationNonce, setAccelerationNonce] = useState(0);
  const [preAccelDeadline, setPreAccelDeadline] = useState<string | null>(null);

  const effectiveDeadline = status?.effectiveDeletionDeadline ?? status?.deadlineAt ?? null;
  const isAccelerated = status?.isAccelerated ?? false;

  const deletionNote = useMemo(() => {
    if (!effectiveDeadline) return null;
    if (isAccelerated) {
      return strings.accountDeletionNoteAccelerated;
    }
    return formatString(strings.accountDeletionNote, {
      date: formatDate(effectiveDeadline),
    });
  }, [effectiveDeadline, isAccelerated, strings]);

  const handleAccelerated = useCallback(
    async (result: { acceleratedDeletionAt: string }) => {
      setPreAccelDeadline(effectiveDeadline);
      setAccelerationNonce((n) => n + 1);
      await reload();
      void result;
    },
    [effectiveDeadline, reload]
  );

  return (
    <div className="mx-auto w-full max-w-md flex-col px-4 pb-8 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <PersonnelClosureBrandBar />

      <div className="mt-2 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_48px_rgba(14,21,72,0.1)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30">
        <div className="bg-gradient-to-b from-amber-50/90 via-orange-50/30 to-white px-4 py-6 sm:px-6 sm:py-7 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900">
          {isAccelerated ? (
            <span className="mb-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-100/90 px-3 py-1 text-[11px] font-semibold text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
                {accelStrings.acceleratedBadge}
              </span>
            </span>
          ) : null}
          {deletionNote ? (
            <>
              <p className="text-center text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
                {deletionNote}
              </p>
              <p className="mt-2 mb-4 text-center text-xs text-slate-500 dark:text-slate-400">
                {strings.countdownLabel}
              </p>
            </>
          ) : null}
          <AcceleratedClosureCountdown
            deadlineAt={effectiveDeadline}
            phase={status?.phase}
            accelerateFromDeadline={preAccelDeadline ?? status?.deadlineAt ?? null}
            accelerationNonce={accelerationNonce}
          />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <p className="mb-4 text-center text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {strings.downloadHint}
          </p>
          <PersonnelClosureDossierPanel variant="closure" embedded showCountdown={false} showDailyLimit={false} />
          {status?.canAccelerate && status.maskedEmail ? (
            <PersonnelClosureAccelerationPanel
              maskedEmail={status.maskedEmail}
              onAccelerated={(r) => void handleAccelerated(r)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
