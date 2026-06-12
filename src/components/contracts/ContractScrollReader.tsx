'use client';

import { useCallback, useRef, useState } from 'react';
import { FiCheck } from 'react-icons/fi';

export type ContractItem = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  contentHtml: string;
  version: number;
};

type Props = {
  contract: ContractItem;
  accepted: boolean;
  onAcceptChange: (contractId: string, accepted: boolean) => void;
};

export function ContractScrollReader({ contract, accepted, onAcceptChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
    if (atEnd) setScrolledToEnd(true);
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 dark:bg-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{contract.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">Sürüm {contract.version} — sonuna kadar kaydırın</p>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="max-h-56 sm:max-h-64 overflow-y-auto px-4 py-3 text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none contract-body"
        dangerouslySetInnerHTML={{ __html: contract.contentHtml }}
      />

      {!scrolledToEnd && !accepted && (
        <p className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
          Devam etmek için sözleşmeyi sonuna kadar okuyun (aşağı kaydırın).
        </p>
      )}

      <label className="flex items-start gap-3 px-4 py-3 border-t border-slate-200 cursor-pointer select-none">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          checked={accepted}
          disabled={!scrolledToEnd && !accepted}
          onChange={(e) => onAcceptChange(contract.id, e.target.checked)}
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          <FiCheck className="inline w-4 h-4 mr-1 text-emerald-600" />
          Okudum, anladım ve kabul ediyorum.
        </span>
      </label>
    </div>
  );
}
