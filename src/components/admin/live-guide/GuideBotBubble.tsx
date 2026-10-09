'use client';

import { FiMessageCircle } from 'react-icons/fi';

type Props = {
  text: string;
  chapter: string;
};

export function GuideBotBubble({ text, chapter }: Props) {
  return (
    <div className="flex gap-3" role="status" aria-live="polite" aria-atomic="true">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0E1548] text-white shadow-sm">
        <FiMessageCircle className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Rehber · {chapter}
        </p>
        <p className="mt-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#0E1548] shadow-sm">
          {text}
        </p>
      </div>
    </div>
  );
}
