'use client';

import { useEffect, useState } from 'react';
import { FiCheck, FiLock, FiX } from 'react-icons/fi';
import { changePersonnelPassword } from '@/lib/personnel-api';
import {
  PERSONNEL_PIN_LENGTH,
  sanitizePersonnelPinInput,
  validatePersonnelPin,
} from '@/lib/personnel-pin';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PersonnelPasswordModal({ open, onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    setSuccess(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }
    const pinError = validatePersonnelPin(next);
    if (pinError) {
      setError(pinError);
      return;
    }
    setLoading(true);
    try {
      await changePersonnelPassword(current, next);
      setSuccess(true);
      window.setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-base tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
        className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl safe-pb"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600">
              <FiLock className="w-4 h-4" />
            </span>
            <div>
              <h2 id="password-modal-title" className="font-semibold text-slate-900 dark:text-white">
                Şifre değiştir
              </h2>
              <p className="text-xs text-slate-500">{PERSONNEL_PIN_LENGTH} haneli PIN</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Kapat"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-10 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
              <FiCheck className="w-7 h-7" />
            </span>
            <p className="font-medium text-slate-900 dark:text-white">Şifreniz güncellendi</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <Field label="Mevcut şifre">
              <input
                type="password"
                className={inputClass}
                value={current}
                onChange={(e) => setCurrent(sanitizePersonnelPinInput(e.target.value))}
                inputMode="numeric"
                maxLength={PERSONNEL_PIN_LENGTH}
                required
                autoComplete="current-password"
                autoFocus
              />
            </Field>
            <Field label="Yeni şifre">
              <input
                type="password"
                className={inputClass}
                value={next}
                onChange={(e) => setNext(sanitizePersonnelPinInput(e.target.value))}
                inputMode="numeric"
                maxLength={PERSONNEL_PIN_LENGTH}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Yeni şifre (tekrar)">
              <input
                type="password"
                className={inputClass}
                value={confirm}
                onChange={(e) => setConfirm(sanitizePersonnelPinInput(e.target.value))}
                inputMode="numeric"
                maxLength={PERSONNEL_PIN_LENGTH}
                required
                autoComplete="new-password"
              />
            </Field>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
