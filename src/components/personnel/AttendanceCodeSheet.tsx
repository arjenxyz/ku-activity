'use client';

import { useEffect, useRef } from 'react';
import { FiHash, FiLoader, FiX } from 'react-icons/fi';

type Props = {
  open: boolean;
  onClose: () => void;
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  disabled?: boolean;
  isRescan?: boolean;
  error?: string | null;
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
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 160);
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
        className="absolute inset-0 bg-[#060d14]/88 backdrop-blur-xl"
        aria-label="Kapat"
        onClick={onClose}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-3xl"
        aria-hidden
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-code-title"
        onSubmit={onSubmit}
        className="relative flex h-full flex-col"
      >
        <div className="absolute inset-x-0 top-0 z-10 flex justify-end px-3 pb-2 safe-pt">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition active:bg-black/60"
            aria-label="Kapat"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="attendance-result-pop flex flex-1 flex-col items-center justify-center px-6 pb-[calc(5.5rem+max(3rem,env(safe-area-inset-bottom,0px)))] text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <FiHash className="h-3.5 w-3.5 text-emerald-400" />
            Manuel kod
          </span>

          <div className="relative mt-8 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" aria-hidden />
            <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-400/30">
              <FiHash className="h-10 w-10 text-emerald-400" strokeWidth={2} />
            </div>
          </div>

          <h2
            id="attendance-code-title"
            className="mt-6 text-2xl font-bold leading-tight tracking-tight text-white"
          >
            Kod ile yoklama
          </h2>
          <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-white/65">
            Ustanızın verdiği yoklama kodunu aşağıya girin
          </p>

          <div className="mt-8 w-full max-w-sm space-y-3">
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
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center font-mono text-xl uppercase tracking-[0.18em] text-white outline-none backdrop-blur-sm placeholder:text-white/30 transition focus:border-emerald-400/50 focus:bg-white/[0.12] focus:ring-2 focus:ring-emerald-400/25 disabled:opacity-50"
            />

            {error && (
              <p className="rounded-xl bg-red-950/80 px-3 py-2.5 text-sm text-red-100 backdrop-blur-sm">
                {error}
              </p>
            )}

            {disabled && (
              <p className="text-xs text-amber-200/90">Yoklama saati dışında kod girişi kapalı.</p>
            )}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-[61] px-6 safe-pb-nav">
          <button
            type="submit"
            disabled={submitting || disabled || !code.trim()}
            className="mx-auto inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Gönderiliyor…
              </>
            ) : isRescan ? (
              'Yeniden kaydet'
            ) : (
              'Yoklamaya katıl'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
