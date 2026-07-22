'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCheck, FiChevronDown, FiX } from 'react-icons/fi';

import { formatString } from '@/lib/strings/format';
import type { ContractItem } from './ContractScrollReader';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  contract: ContractItem;
  accepted: boolean;
  onAccept: () => void;
  onClose: () => void;
  closeOnAccept?: boolean;
  stepLabel?: string;
};

export function ContractAcceptanceModal({
  contract,
  accepted,
  onAccept,
  onClose,
  closeOnAccept = true,
  stepLabel,
}: Props) {

  const strings = useRegistryStrings('components/contracts/ContractAcceptanceModal');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(accepted);
  const [scrollProgress, setScrollProgress] = useState(accepted ? 100 : 0);
  const [consentChecked, setConsentChecked] = useState(accepted);

  useBodyScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 12) {
      setScrollProgress(100);
      setScrolledToEnd(true);
      return;
    }
    const progress = Math.min(100, (el.scrollTop / maxScroll) * 100);
    setScrollProgress(progress);
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
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
    setScrolledToEnd(accepted);
    setScrollProgress(accepted ? 100 : 0);
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [contract.id, accepted]);

  useLayoutEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);
    return () => observer.disconnect();
  }, [contract.id, contract.contentHtml, contract.summary, checkScroll]);

  const canAccept = (scrolledToEnd || accepted) && consentChecked;
  const showScrollHint = !scrolledToEnd && !accepted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl h-[min(92dvh,720px)] rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-slate-100 dark:bg-slate-800 shrink-0" aria-hidden>
          <div
            className="h-full bg-blue-600 transition-[width] duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-gradient-to-r from-slate-50 to-blue-50/60 dark:from-slate-900 dark:to-slate-900">
          <div className="min-w-0 flex-1">
            {stepLabel && (
              <span className="inline-block mb-1.5 rounded-full bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {formatString(strings.stepLabel, { stepLabel })}
              </span>
            )}
            <h2
              id="contract-modal-title"
              className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2"
            >
              {contract.title}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              {formatString(strings.version, { version: contract.version })}
              {accepted
                ? strings.accepted
                : scrolledToEnd
                  ? strings.readComplete
                  : strings.scrollRequired}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label={strings.close}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="h-full overflow-y-auto overscroll-none px-4 py-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 [-webkit-overflow-scrolling:touch]"
            data-allow-scroll
          >
            {contract.summary && (
              <div className="mb-4 rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-200 mb-1">
                  {strings.summaryTitle}
                </p>
                <p className="text-sm text-blue-950/90 dark:text-blue-100/90 leading-relaxed">
                  {contract.summary}
                </p>
              </div>
            )}
            <div
              className="prose prose-sm dark:prose-invert max-w-none contract-body"
              dangerouslySetInnerHTML={{ __html: contract.contentHtml }}
            />
          </div>

          {showScrollHint && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 flex items-end justify-center pb-1.5"
              aria-hidden
            >
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1">
                <FiChevronDown className="w-3.5 h-3.5 sm:animate-pulse" />
                {strings.scrollHint}
              </span>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {accepted ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <FiCheck className="w-4 h-4 shrink-0" />
                {strings.acceptedLabel}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {strings.closeButton}
              </button>
            </div>
          ) : (
            <>
              <label
                className={`flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 ${
                  scrolledToEnd ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={consentChecked}
                  disabled={!scrolledToEnd}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                />
                <span>
                  <span className="hidden sm:inline">{strings.consentDesktop}</span>
                  <span className="sm:hidden">{strings.consentMobile}</span>
                </span>
              </label>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  disabled={!canAccept}
                  onClick={() => {
                    onAccept();
                    if (closeOnAccept) onClose();
                  }}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {strings.approve}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1"
                >
                  {strings.later}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
