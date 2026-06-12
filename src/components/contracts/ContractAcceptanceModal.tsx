'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiFileText, FiX } from 'react-icons/fi';
import type { ContractItem } from './ContractScrollReader';

type Props = {
  contract: ContractItem;
  accepted: boolean;
  onAccept: () => void;
  onClose: () => void;
};

export function ContractAcceptanceModal({ contract, accepted, onAccept, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(accepted);
  const [scrollProgress, setScrollProgress] = useState(accepted ? 100 : 0);
  const [consentChecked, setConsentChecked] = useState(accepted);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const progress = maxScroll <= 0 ? 100 : Math.min(100, (el.scrollTop / maxScroll) * 100);
    setScrollProgress(progress);
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
    if (atEnd) setScrolledToEnd(true);
  }, []);

  useEffect(() => {
    if (accepted) {
      setScrolledToEnd(true);
      setScrollProgress(100);
      setConsentChecked(true);
    }
  }, [accepted]);

  useEffect(() => {
    setConsentChecked(accepted);
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 12) {
      setScrolledToEnd(true);
      setScrollProgress(100);
    } else {
      setScrolledToEnd(false);
      setScrollProgress(0);
      el.scrollTop = 0;
    }
  }, [contract.id, accepted]);

  const canAccept = (scrolledToEnd || accepted) && consentChecked;
  const showScrollHint = !scrolledToEnd && !accepted && scrollProgress < 95;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl h-[96dvh] sm:h-auto sm:max-h-[88vh] rounded-t-[1.75rem] sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        </div>

        <div
          className="h-0.5 bg-blue-600 transition-[width] duration-150 shrink-0"
          style={{ width: `${scrollProgress}%` }}
          aria-hidden
        />

        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="min-w-0 flex-1 pr-2">
            <h2
              id="contract-modal-title"
              className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-snug"
            >
              {contract.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sürüm {contract.version}
              {accepted ? ' · Onaylandı' : ' · Sonuna kadar kaydırın'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 -mr-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 shrink-0 touch-manipulation"
            aria-label="Kapat"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {contract.summary && (
          <div className="px-4 sm:px-5 py-3 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 shrink-0">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <FiFileText className="w-3.5 h-3.5" />
              Özet — ne onaylıyorsunuz?
            </p>
            <p className="text-sm text-blue-900/90 dark:text-blue-100/90 leading-relaxed">
              {contract.summary}
            </p>
          </div>
        )}

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="absolute inset-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5 text-[0.9375rem] sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none contract-body [-webkit-overflow-scrolling:touch]"
            dangerouslySetInnerHTML={{ __html: contract.contentHtml }}
          />

          {showScrollHint && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 flex items-end justify-center pb-2"
              aria-hidden
            >
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 animate-bounce">
                <FiChevronDown className="w-4 h-4" />
                Devamını okuyun
              </span>
            </div>
          )}
        </div>

        {!scrolledToEnd && !accepted && (
          <p className="px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border-t border-amber-100 dark:border-amber-900 shrink-0">
            Onaylamak için sözleşmeyi sonuna kadar okuyun.
          </p>
        )}

        <div className="px-4 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-900 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)] space-y-2.5">
          {accepted ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2 py-1">
              <FiCheck className="w-4 h-4 shrink-0" />
              Bu sözleşmeyi onayladınız.
            </p>
          ) : (
            <>
              <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  disabled={!scrolledToEnd}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                />
                <span>
                  Yukarıdaki özeti ve sözleşme metninin tamamını okudum; hiçbir baskı altında
                  kalmadan özgür irademle kabul ediyorum.
                </span>
              </label>
              <button
                type="button"
                disabled={!canAccept}
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="w-full min-h-[48px] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation transition-colors"
              >
                Okudum, anladım ve kabul ediyorum
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 touch-manipulation"
          >
            {accepted ? 'Kapat' : 'Daha sonra'}
          </button>
        </div>
      </div>
    </div>
  );
}
