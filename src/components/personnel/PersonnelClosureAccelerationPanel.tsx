'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiMail, FiX, FiZap } from 'react-icons/fi';
import { formatString } from '@/lib/strings/format';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const OTP_LENGTH = 6;

type Props = {
  maskedEmail: string;
  onAccelerated: (result: { acceleratedDeletionAt: string }) => void;
};

export function PersonnelClosureAccelerationPanel({ maskedEmail, onAccelerated }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelClosureAcceleration');
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(open);

  const sendCode = useCallback(async () => {
    setPreparing(true);
    setError(null);
    try {
      const res = await fetch('/api/personnel/closure/accelerate-deletion/prepare', {
        method: 'POST',
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || strings.errors.generic);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setPreparing(false);
    }
  }, [strings.errors.generic]);

  const verifyCode = async () => {
    if (code.replace(/\D/g, '').length < OTP_LENGTH) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/personnel/closure/accelerate-deletion/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: code.replace(/\D/g, '') }),
      });
      const data = (await res.json()) as { error?: string; acceleratedDeletionAt?: string };
      if (!res.ok || !data.acceleratedDeletionAt) {
        throw new Error(data.error || strings.errors.invalidCode);
      }
      setOpen(false);
      setCode('');
      onAccelerated({ acceleratedDeletionAt: data.acceleratedDeletionAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
        <p className="mb-3 text-center text-xs text-slate-500 dark:text-slate-400">{strings.accelerateHint}</p>
        <button
          type="button"
          onClick={() => void sendCode()}
          disabled={preparing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-400/80 bg-amber-50/80 px-4 py-3 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-600/50 dark:bg-amber-950/20 dark:text-amber-200 dark:hover:bg-amber-950/40"
        >
          {preparing ? (
            strings.preparing
          ) : (
            <>
              <FiZap className="h-4 w-4" strokeWidth={2.5} />
              {strings.accelerateCta}
            </>
          )}
        </button>
        {error && !open ? (
          <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandMark size="sm" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{strings.modalTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatString(strings.modalSubtitle, { email: maskedEmail })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={strings.cancel}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex justify-center">
              <FiMail className="h-8 w-8 text-amber-600" />
            </div>

            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              placeholder={strings.otpPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.35em] text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            {error ? (
              <p className="mt-3 text-center text-xs text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => void verifyCode()}
                disabled={verifying || code.length < OTP_LENGTH}
                className="w-full rounded-2xl bg-[#0E1548] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {verifying ? strings.verifying : strings.verify}
              </button>
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={preparing}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                {strings.resend}
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] text-slate-400">{APP_NAME}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
