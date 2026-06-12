'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiExternalLink,
  FiMail,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import type { PendingRegistration } from '@/lib/registration-pending-storage';

const OTP_LENGTH = 6;

type Props = {
  open: boolean;
  formData: FormData | null;
  onClose: () => void;
  onSuccess: (pending: PendingRegistration) => void;
};

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  const focusIndex = (index: number) => {
    refs.current[index]?.focus();
    refs.current[index]?.select();
  };

  const applyDigits = (chars: string[], startIndex = 0) => {
    const next = [...digits];
    chars.forEach((char, offset) => {
      const idx = startIndex + offset;
      if (idx < OTP_LENGTH) next[idx] = char;
    });
    onChange(next.join('').replace(/\s/g, ''));
    const lastFilled = Math.min(startIndex + chars.length, OTP_LENGTH - 1);
    if (chars.length > 0) focusIndex(lastFilled);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join('').trim());
      return;
    }
    applyDigits([digit], index);
    if (index < OTP_LENGTH - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, OTP_LENGTH) - 1);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Doğrulama kodu ${index + 1}. hane`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-12 sm:w-12 sm:h-14 rounded-xl border text-center text-lg sm:text-xl font-semibold font-mono transition-colors ${
            disabled
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              : digit
                ? 'bg-white dark:bg-slate-900 border-blue-400 dark:border-blue-500 text-slate-900 dark:text-white shadow-sm shadow-blue-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          }`}
        />
      ))}
    </div>
  );
}

export function ContractEmailVerificationModal({
  open,
  formData,
  onClose,
  onSuccess,
}: Props) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(null);
  const [error, setError] = useState('');
  const autoVerifyLock = useRef(false);

  const resetState = useCallback(() => {
    setCode('');
    setSentTo(null);
    setExpiresInMinutes(null);
    setError('');
    autoVerifyLock.current = false;
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !verifying && !sending) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, verifying, sending, resetState]);

  const sendCode = useCallback(async () => {
    if (!formData) return;
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/public/contract-otp/prepare', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'E-posta gönderilemedi');
      setSentTo(data.maskedDestination as string);
      setExpiresInMinutes(
        typeof data.expiresInMinutes === 'number' ? data.expiresInMinutes : null
      );
      setCode('');
      autoVerifyLock.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-posta gönderilemedi');
    } finally {
      setSending(false);
    }
  }, [formData]);

  useEffect(() => {
    if (open && formData && !sentTo && !sending && !error) {
      void sendCode();
    }
  }, [open, formData, sentTo, sending, error, sendCode]);

  const handleVerify = useCallback(async () => {
    if (!formData || code.length !== OTP_LENGTH || verifying) return;
    const email = String(formData.get('email') ?? '').trim();
    setError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/public/contract-otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Doğrulama başarısız');

      onSuccess({
        verificationCode: data.verificationCode,
        approvalUrl: data.approvalUrl,
        reused: data.reused,
        tcKimlik: String(formData.get('tcKimlik') ?? ''),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doğrulama başarısız');
      autoVerifyLock.current = false;
    } finally {
      setVerifying(false);
    }
  }, [code, formData, onSuccess, verifying]);

  useEffect(() => {
    if (code.length !== OTP_LENGTH || !sentTo || verifying || sending) {
      if (code.length < OTP_LENGTH) autoVerifyLock.current = false;
      return;
    }
    if (autoVerifyLock.current) return;
    autoVerifyLock.current = true;
    void handleVerify();
  }, [code, sentTo, verifying, sending, handleVerify]);

  if (!open) return null;

  const busy = sending || verifying;
  const step = !sentTo ? 1 : 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-verify-title"
      onClick={() => !busy && onClose()}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-slate-100 dark:bg-slate-800 shrink-0" aria-hidden>
          <div
            className="h-full bg-blue-600 transition-[width] duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <BrandMark size="sm" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {APP_NAME}
            </p>
            <h2
              id="email-verify-title"
              className="text-base font-semibold text-slate-900 dark:text-white leading-snug mt-0.5"
            >
              E-posta doğrulama
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Başvurunuzu tamamlamak için e-postanızı onaylayın
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 -mr-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 shrink-0"
            aria-label="Kapat"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
          <ol className="flex items-center gap-2 text-[11px] font-medium">
            <li
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                step >= 1
                  ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                  : 'text-slate-400'
              }`}
            >
              {sentTo ? <FiCheck className="w-3 h-3" /> : <span className="w-3 text-center">1</span>}
              E-posta gönder
            </li>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden>
              →
            </span>
            <li
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                step >= 2
                  ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                  : 'text-slate-400'
              }`}
            >
              <span className="w-3 text-center">2</span>
              Kodu onayla
            </li>
          </ol>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {sending && !sentTo && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <FiMail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white dark:border-slate-900 border-t-blue-600 rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Doğrulama e-postası hazırlanıyor
                </p>
                <p className="text-xs text-slate-500 mt-1">Birkaç saniye sürebilir…</p>
              </div>
            </div>
          )}

          {sentTo && (
            <>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                    <FiMail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gönderildi</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {sentTo}
                    </p>
                    {expiresInMinutes != null && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Kod {expiresInMinutes} dakika geçerlidir
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Hızlı yol
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                  <FiExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
                  E-postadaki <strong className="font-medium text-slate-800 dark:text-slate-200">“Başvurumu doğrula”</strong>{' '}
                  bağlantısına tıklayın — kod girmeden başvuru tamamlanır.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center mb-3">
                  veya 6 haneli kodu girin
                </p>
                <OtpInput value={code} onChange={setCode} disabled={verifying} />
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || code.length !== OTP_LENGTH}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Başvuru gönderiliyor…
                  </>
                ) : (
                  'Kodu doğrula ve başvuruyu gönder'
                )}
              </button>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => void sendCode()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 transition-colors"
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                  {sending ? 'Yeni kod gönderiliyor…' : 'Kodu tekrar gönder'}
                </button>
              </div>
            </>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3.5 py-3 text-sm text-red-800 dark:text-red-200"
            >
              <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {!sentTo && error && (
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={sending}
              className="w-full min-h-[44px] py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Tekrar dene
            </button>
          )}
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-relaxed">
            E-posta gelmediyse spam klasörünü kontrol edin. Kod yalnızca bu başvuru için geçerlidir.
          </p>
        </div>
      </div>
    </div>
  );
}
