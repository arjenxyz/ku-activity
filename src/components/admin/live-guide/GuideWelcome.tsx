'use client';

import { FiPlay } from 'react-icons/fi';

type Props = {
  onStart: () => void;
  onSkip: () => void;
};

export function GuideWelcome({ onStart, onSkip }: Props) {
  return (
    <div className="flex min-h-[min(70dvh,560px)] flex-col items-center justify-center px-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#0E1548] sm:text-3xl">
        Admin ana sayfası
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        Canlı rehber, menüleri ve araçları taklit ederek adım adım gösterir. Gerçek veriye
        dokunulmaz — Devam ile ilerlersin.
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-5 py-3 text-sm font-semibold text-white hover:bg-[#152060]"
        >
          <FiPlay className="h-4 w-4" aria-hidden />
          Rehbere başla
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Atla · Etkinliklere git
        </button>
      </div>
    </div>
  );
}
