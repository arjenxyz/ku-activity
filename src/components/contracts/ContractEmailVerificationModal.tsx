'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiCopy, FiMail, FiX } from 'react-icons/fi';
import type { PendingRegistration } from '@/lib/registration-pending-storage';

type Props = {
  open: boolean;
  formData: FormData | null;
  onClose: () => void;
  onSuccess: (pending: PendingRegistration) => void;
};

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
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [copied, setCopied] = useState(false);

  const resetState = useCallback(() => {
    setCode('');
    setSentTo(null);
    setError('');
    setInfo('');
    setCopied(false);
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
    setInfo('');
    setSending(true);
    try {
      const res = await fetch('/api/public/contract-otp/prepare', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'E-posta gönderilemedi');
      setSentTo(data.maskedDestination as string);
      setInfo(
        `${data.maskedDestination} adresine kod ve doğrulama bağlantısı gönderildi (${data.expiresInMinutes} dk geçerli).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-posta gönderilemedi');
    } finally {
      setSending(false);
    }
  }, [formData]);

  useEffect(() => {
    if (open && formData && !sentTo && !sending) {
      void sendCode();
    }
  }, [open, formData, sentTo, sending, sendCode]);

  const handleVerify = async () => {
    if (!formData) return;
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
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyHint = async () => {
    if (code.length !== 6) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* */
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-verify-title"
      onClick={() => !verifying && !sending && onClose()}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[1.75rem] sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FiMail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="email-verify-title" className="text-lg font-semibold leading-snug">
                E-posta doğrulama
              </h2>
              <p className="text-sm text-blue-100 mt-0.5">
                Kodu girin veya gelen kutunuzdaki bağlantıya tıklayın
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={verifying || sending}
            className="p-2 rounded-xl text-white/80 hover:bg-white/10 disabled:opacity-40"
            aria-label="Kapat"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {sending && !sentTo && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Doğrulama e-postası gönderiliyor…</p>
            </div>
          )}

          {sentTo && (
            <>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium">{sentTo}</p>
                <p className="text-xs mt-1 text-blue-800/80 dark:text-blue-200/80">
                  E-postanızdaki 6 haneli kodu aşağıya girin veya &quot;Başvurumu doğrula ve gönder&quot;
                  bağlantısına tıklayın.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Doğrulama kodu
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] font-mono"
                    disabled={verifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCopyHint}
                    disabled={code.length !== 6}
                    title="Kodu panoya kopyala"
                    className="px-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <FiCheckCircle className="w-3.5 h-3.5" /> Kopyalandı
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || code.length !== 6}
                className="w-full min-h-[48px] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40"
              >
                {verifying ? 'Başvuru gönderiliyor…' : 'Kodu doğrula ve başvuruyu gönder'}
              </button>

              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={sending || verifying}
                className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:underline disabled:opacity-50"
              >
                {sending ? 'Gönderiliyor…' : 'Yeni kod gönder'}
              </button>
            </>
          )}

          {info && (
            <p className="text-xs text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-3 py-2">
              {info}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-700 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
