'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiZap } from 'react-icons/fi';
import { PersonnelClosureBrandBar } from './PersonnelClosureBrandBar';
import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';
import { AcceleratedClosureCountdown } from './AcceleratedClosureCountdown';
import { PersonnelClosureAccelerationPanel } from './PersonnelClosureAccelerationPanel';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate } from '@/lib/format';
import { formatString } from '@/lib/strings/format';

type FastDeleteGuideStrings = {
  fastDeleteTitle: string;
  fastDeleteIntro: string;
  fastDeleteStep1: string;
  fastDeleteStep2: string;
  fastDeleteStep3: string;
  fastDeleteFooter: string;
};

function FastDeleteGuide({
  strings,
  step1Done,
  step2Done,
}: {
  strings: FastDeleteGuideStrings;
  step1Done: boolean;
  step2Done: boolean;
}) {
  const steps = [
    { label: strings.fastDeleteStep1, done: step1Done },
    { label: strings.fastDeleteStep2, done: step2Done },
    { label: strings.fastDeleteStep3, done: false },
  ];

  return (
    <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
          <FiZap className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          {strings.fastDeleteTitle}
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
        {strings.fastDeleteIntro}
      </p>
      <ol className="mt-3 space-y-2.5">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              {step.done ? <FiCheck className="h-3 w-3" strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={`text-xs leading-snug ${
                step.done
                  ? 'text-emerald-700 line-through decoration-emerald-500/50 dark:text-emerald-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-amber-200/60 pt-3 text-[11px] leading-relaxed text-amber-700/80 dark:border-amber-800/40 dark:text-amber-300/70">
        {strings.fastDeleteFooter}
      </p>
    </div>
  );
}

/** Proje kapanış modunda veri indirme ekranı */
export function PersonnelClosureScreen() {
  const router = useRouter();
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

  const [purging, setPurging] = useState(false);

  const handleDeletionDue = useCallback(async () => {
    if (purging || !status?.isAccelerated) return;
    setPurging(true);
    try {
      const res = await fetch('/api/personnel/closure/execute-deletion', { method: 'POST' });
      if (res.ok) {
        router.replace('/personnel-panel/login');
        router.refresh();
      }
    } finally {
      setPurging(false);
    }
  }, [purging, router, status?.isAccelerated]);

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
            onExpired={status?.isAccelerated ? () => void handleDeletionDue() : undefined}
          />
          {purging ? (
            <p className="mt-3 text-center text-xs font-medium text-slate-500">
              {accelStrings.purgingLabel}
            </p>
          ) : null}
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
          ) : !isAccelerated ? (
            <FastDeleteGuide
              strings={strings}
              step1Done={Boolean(status?.consent?.dataExportedAt)}
              step2Done={Boolean(status?.consent?.dataExportAcknowledgedAt)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
