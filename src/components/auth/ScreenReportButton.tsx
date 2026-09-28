'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiLoader, FiX } from 'react-icons/fi';
import { IoWarning } from 'react-icons/io5';
import { captureElementScreenshot } from '@/lib/capture-screen';
import {
  personnelAuthInputClass,
  personnelAuthPrimaryBtnClass,
  personnelAuthSecondaryBtnClass,
} from '@/lib/personnel-auth-ui';
import { useAuthReport } from '@/components/auth/AuthReportContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  captureRootRef: React.RefObject<HTMLElement | null>;
  screenLabel?: string;
  tone?: 'photo' | 'home';
};

export function ScreenReportButton({ captureRootRef, screenLabel, tone = 'photo' }: Props) {

  const strings = useRegistryStrings('components/auth/ScreenReportButton');
  const { getReportPayload } = useAuthReport();
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  useBodyScrollLock(open && Boolean(screenshot));

  const handleOpen = useCallback(async () => {
    const root = captureRootRef.current;
    if (!root || capturing) return;
    setCapturing(true);
    setStatus('idle');
    setErrorMsg('');
    try {
      const dataUrl = await captureElementScreenshot(root);
      setScreenshot(dataUrl);
      setOpen(true);
    } catch {
      setErrorMsg(strings.screenshotFailed);
    } finally {
      setCapturing(false);
    }
  }, [captureRootRef, capturing]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setScreenshot(null);
    setNote('');
    setStatus('idle');
    setErrorMsg('');
  }, []);

  const handleSubmit = async () => {
    if (!screenshot || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = getReportPayload();
      const res = await fetch('/api/public/screen-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot,
          ...payload,
          note: note.trim() || undefined,
          screenLabel,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || strings.sendFailed);
      setStatus('success');
      window.setTimeout(() => handleClose(), 2200);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : strings.reportSendFailed);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, handleClose]);

  return (
    <>
      <button
        type="button"
        onClick={() => void handleOpen()}
        disabled={capturing}
        aria-label={strings.reportAriaLabel}
        title={strings.reportTitle}
        className={`screen-report-ignore inline-flex h-9 shrink-0 items-center gap-1.5 px-1 transition-colors disabled:opacity-60 ${
          tone === 'home' ? 'text-slate-500 hover:text-[#0E1548]' : 'text-white/90 hover:text-white'
        }`}
      >
        {capturing ? (
          <FiLoader
            className={`h-4 w-4 animate-spin ${tone === 'home' ? 'text-slate-400' : 'text-white/80'}`}
            aria-hidden
          />
        ) : (
          <IoWarning
            className={`h-4 w-4 shrink-0 text-amber-500 ${tone === 'home' ? '' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]'}`}
            aria-hidden
          />
        )}
        <span
          className={`text-xs font-semibold tracking-wide ${
            tone === 'home' ? '' : 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]'
          }`}
        >
          {strings.reportButton}
        </span>
      </button>

      {open && screenshot ? (
        <div
          className="screen-report-modal-root fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="screen-report-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-200">
              <div>
                <h2 id="screen-report-title" className="text-lg font-bold text-slate-900">
                  {strings.modalTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{strings.modalDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!submitting) handleClose();
                }}
                disabled={submitting}
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={strings.close}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshot}
                  alt={strings.previewAlt}
                  className="w-full max-h-40 object-cover object-top"
                />
              </div>

              <div>
                <label htmlFor="screen-report-note" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {strings.noteLabel}
                </label>
                <textarea
                  id="screen-report-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  placeholder={strings.notePlaceholder}
                  className={`${personnelAuthInputClass} resize-none`}
                />
              </div>

              {status === 'success' && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {strings.success}
                </p>
              )}
              {errorMsg ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              ) : null}
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={() => {
                  if (!submitting) handleClose();
                }}
                disabled={submitting}
                className={`flex-1 ${personnelAuthSecondaryBtnClass}`}
              >
                {strings.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || status === 'success'}
                className={`flex-1 ${personnelAuthPrimaryBtnClass}`}
              >
                {submitting ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    {strings.submitting}
                  </>
                ) : (
                  strings.confirmAndSend
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
