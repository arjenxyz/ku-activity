'use client';

import { useEffect, useRef } from 'react';
import { FiHash, FiX } from 'react-icons/fi';

type Props = {
  open: boolean;
  onClose: () => void;
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  disabled?: boolean;
  isRescan?: boolean;
};

export function AttendanceCodeSheet({
  open,
  onClose,
  code,
  onCodeChange,
  onSubmit,
  submitting,
  disabled,
  isRescan,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] sm:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-code-title"
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-white/10 bg-white shadow-2xl dark:bg-slate-900 safe-pb"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        <div className="px-5 pb-5 pt-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <FiHash className="h-5 w-5" />
              </div>
              <div>
                <h2 id="attendance-code-title" className="text-base font-semibold text-slate-900 dark:text-white">
                  Kod ile yoklama
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Ustanızın verdiği yoklama kodunu girin
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Kapat"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              ref={inputRef}
              id="attendance-manual-code"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="YOK-…"
              value={code}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
              disabled={submitting || disabled}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center font-mono text-xl uppercase tracking-[0.18em] text-slate-900 outline-none ring-emerald-500/30 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={submitting || disabled || !code.trim()}
              className="w-full rounded-2xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Gönderiliyor…' : isRescan ? 'Yeniden kaydet' : 'Yoklamaya katıl'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
