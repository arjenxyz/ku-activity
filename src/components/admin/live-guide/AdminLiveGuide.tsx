'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiArrowRight, FiRotateCcw } from 'react-icons/fi';
import { GUIDE_STEPS, getGuideProgress } from '@/lib/admin/live-guide/script';
import { GUIDE_STORAGE_KEY } from '@/lib/admin/live-guide/types';
import { GuideBotBubble } from './GuideBotBubble';
import { GuideProgress } from './GuideProgress';
import { GuideStage } from './GuideStage';
import { GuideWelcome } from './GuideWelcome';

type Phase = 'welcome' | 'tour' | 'done';

export function AdminLiveGuide() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('welcome');
  const [stepIndex, setStepIndex] = useState(0);

  const progress = getGuideProgress(stepIndex);
  const step = progress.step;
  const isLast = stepIndex >= GUIDE_STEPS.length - 1;
  const navMode = step.navMode ?? 'root';

  const markDone = useCallback(() => {
    try {
      localStorage.setItem(GUIDE_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const goEvents = useCallback(() => {
    markDone();
    router.push('/admin/events');
  }, [markDone, router]);

  const start = () => {
    setPhase('tour');
    setStepIndex(0);
  };

  const next = useCallback(() => {
    if (isLast) {
      markDone();
      setPhase('done');
      return;
    }
    setStepIndex((i) => Math.min(i + 1, GUIDE_STEPS.length - 1));
  }, [isLast, markDone]);

  const back = () => {
    if (stepIndex <= 0) {
      setPhase('welcome');
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const restart = () => {
    setPhase('welcome');
    setStepIndex(0);
  };

  useEffect(() => {
    if (phase !== 'tour') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next]);

  if (phase === 'welcome') {
    return <GuideWelcome onStart={start} onSkip={goEvents} />;
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[min(60dvh,480px)] flex-col items-center justify-center px-2 text-center">
        <h2 className="text-xl font-semibold text-[#0E1548]">Hazırsın</h2>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Gerçek menüden Etkinlikler’e giderek paneli kullanmaya başlayabilirsin. İstersen rehberi
          yeniden aç.
        </p>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/admin/events"
            onClick={markDone}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-5 py-3 text-sm font-semibold text-white hover:bg-[#152060]"
          >
            Etkinliklere git
            <FiArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <FiRotateCcw className="h-4 w-4" />
            Rehberi yeniden başlat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-24 sm:pb-8">
      <div className="space-y-4">
        <GuideProgress
          current={progress.current}
          total={progress.total}
          percent={progress.percent}
        />
        <GuideBotBubble text={step.botText} chapter={step.chapter} />
        <GuideStage
          stage={step.stage}
          navMode={navMode}
          highlight={step.highlight}
          pulse={step.pulse}
        />
      </div>

      {/* Desktop / tablet controls */}
      <div className="mt-6 hidden items-center justify-between gap-3 sm:flex">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <FiArrowLeft className="h-4 w-4" />
          Geri
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goEvents}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Atla
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0E1548] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152060]"
          >
            {isLast ? 'Bitir' : 'Devam'}
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur-lg sm:hidden safe-pb">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={back}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
            aria-label="Geri"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goEvents}
            className="shrink-0 rounded-xl px-2 py-2 text-xs font-medium text-slate-500"
          >
            Atla
          </button>
          <button
            type="button"
            onClick={next}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0E1548] text-sm font-semibold text-white"
          >
            {isLast ? 'Bitir' : 'Devam'}
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
