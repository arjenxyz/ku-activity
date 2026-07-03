'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiLoader, FiX } from 'react-icons/fi';
import { AuthAlert } from '@/components/auth/AuthAlerts';
import { TurkishPhoneInput } from '@/components/forms/TurkishPhoneInput';
import {
  personnelAuthInfoBannerClass,
  personnelAuthInputClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthMutedTextClass,
  personnelAuthPrimaryBtnClass,
  personnelAuthSecondaryBtnClass,
} from '@/lib/personnel-auth-ui';

type View = 'form' | 'no-email' | 'success' | 'link-sent';

type Props = {
  open: boolean;
  onClose: () => void;
  initialTc?: string;
};

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;

export function ForgotPinModal({ open, onClose, initialTc = '' }: Props) {
  const [view, setView] = useState<View>('form');
  const [tcKimlik, setTcKimlik] = useState(initialTc);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setView('form');
    setPhone('');
    setEmail('');
    setError('');
    setMaskedEmail(null);
    setSubmitting(false);
    setHintLoading(false);
    setLinkSending(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    setTcKimlik(initialTc);
    onClose();
  }, [initialTc, onClose, resetState]);

  useEffect(() => {
    if (open) {
      setTcKimlik(initialTc.replace(/\D/g, '').slice(0, 11));
    } else {
      resetState();
    }
  }, [open, initialTc, resetState]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting && !hintLoading && !linkSending) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, hintLoading, linkSending, handleClose]);

  const formReady =
    tcKimlik.replace(/\D/g, '').length === 11 && phone.trim().length > 0 && email.trim().length > 0;

  const handleSendLink = async () => {
    if (linkSending || !formReady) return;
    setError('');
    setLinkSending(true);
    try {
      const res = await fetch('/api/public/personnel-pin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-link',
          tcKimlik,
          phone,
          email,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Link gönderilemedi');
      setView('link-sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link gönderilemedi');
    } finally {
      setLinkSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/personnel-pin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          tcKimlik,
          phone,
          email,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Talep gönderilemedi');
      setView('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailHint = async () => {
    if (hintLoading) return;
    setError('');
    setMaskedEmail(null);
    setHintLoading(true);
    try {
      const res = await fetch('/api/public/personnel-pin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'email-hint',
          tcKimlik,
          phone,
        }),
      });
      const data = (await res.json()) as { error?: string; maskedEmail?: string };
      if (!res.ok) throw new Error(data.error || 'Sorgu yapılamadı');
      setMaskedEmail(data.maskedEmail ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sorgu yapılamadı');
    } finally {
      setHintLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-pin-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[min(92dvh,720px)] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="forgot-pin-title" className="text-lg font-bold text-slate-900">
              PIN sıfırlama
            </h2>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              {view === 'no-email'
                ? 'E-postanızı hatırlamıyorsanız aşağıdaki seçenekleri kullanın.'
                : view === 'link-sent'
                  ? 'E-postanızı kontrol edin.'
                  : view === 'success'
                  ? 'Talebiniz işleme alındı.'
                  : 'Kimliğinizi doğrulamak için kayıtlı bilgilerinizi girin.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting || hintLoading || linkSending}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {view === 'link-sent' ? (
            <div className="space-y-4">
              <AuthAlert
                type="success"
                tone="personnel"
                message="Sıfırlama linki e-posta adresinize gönderildi. Bağlantı 30 dakika geçerlidir; e-postadaki linke tıklayarak yeni PIN'inizi belirleyebilirsiniz."
              />
              <button type="button" onClick={handleClose} className={personnelAuthPrimaryBtnClass}>
                Tamam
              </button>
            </div>
          ) : view === 'success' ? (
            <div className="space-y-4">
              <AuthAlert
                type="success"
                tone="personnel"
                message="Bilgileriniz doğrulandı. PIN sıfırlama talebiniz alındı; kayıtlı e-posta adresinize bilgi gönderildi. Yöneticiniz yeni PIN'inizi tanımlayacaktır."
              />
              <button type="button" onClick={handleClose} className={personnelAuthPrimaryBtnClass}>
                Tamam
              </button>
            </div>
          ) : view === 'no-email' ? (
            <div className="space-y-4">
              <div className={personnelAuthMutedTextClass.replace('text-xs', 'text-sm')}>
                <p className="mb-2">
                  E-posta adresinizi hatırlamıyorsanız <strong>şantiye yöneticinize</strong> veya{' '}
                  <strong>İK biriminize</strong> başvurun. T.C. kimlik numaranızı ve telefonunuzu
                  paylaşarak PIN sıfırlama talep edebilirsiniz.
                </p>
                <p>
                  Yöneticiniz admin panelinden PIN&apos;inizi sıfırlayabilir; yeni PIN size güvenli
                  bir kanaldan iletilir.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-tc-hint">
                  T.C. Kimlik No
                </label>
                <input
                  id="forgot-pin-tc-hint"
                  className={inputClass}
                  data-sensitive-capture
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="11 haneli T.C. kimlik"
                  maxLength={11}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-phone-hint">
                  Telefon
                </label>
                <TurkishPhoneInput
                  id="forgot-pin-phone-hint"
                  value={phone}
                  onChange={setPhone}
                  allowCountryCodeSelect
                  placeholder="5xx xxx xx xx"
                />
              </div>

              {maskedEmail ? (
                <p className={personnelAuthInfoBannerClass}>
                  Kayıtlı e-posta adresiniz <strong>{maskedEmail}</strong> şeklinde görünüyor.
                  Hatırladıysanız tam adresi girerek talep oluşturabilirsiniz.
                </p>
              ) : null}

              {error ? <AuthAlert type="error" tone="personnel" message={error} /> : null}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void handleEmailHint()}
                  disabled={
                    hintLoading ||
                    tcKimlik.replace(/\D/g, '').length !== 11 ||
                    !phone.trim()
                  }
                  className={`w-full inline-flex items-center justify-center gap-2 ${personnelAuthSecondaryBtnClass}`}
                >
                  {hintLoading ? (
                    <>
                      <FiLoader className="inline h-4 w-4 animate-spin mr-2" />
                      Kontrol ediliyor…
                    </>
                  ) : (
                    'Kayıtlı e-postamı göster'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('form');
                    setError('');
                    setMaskedEmail(null);
                  }}
                  className={personnelAuthPrimaryBtnClass}
                >
                  E-postamı hatırladım
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="forgot-pin-tc">
                  T.C. Kimlik No *
                </label>
                <input
                  id="forgot-pin-tc"
                  className={inputClass}
                  data-sensitive-capture
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="11 haneli T.C. kimlik"
                  maxLength={11}
                  inputMode="numeric"
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-phone">
                  Telefon *
                </label>
                <TurkishPhoneInput
                  id="forgot-pin-phone"
                  value={phone}
                  onChange={setPhone}
                  allowCountryCodeSelect
                  placeholder="5xx xxx xx xx"
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-email">
                  E-posta *
                </label>
                <input
                  id="forgot-pin-email"
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  autoComplete="email"
                  required
                />
              </div>

              {error ? <AuthAlert type="error" tone="personnel" message={error} /> : null}

              <button
                type="button"
                onClick={() => void handleSendLink()}
                disabled={linkSending || submitting || !formReady}
                className={personnelAuthPrimaryBtnClass}
              >
                {linkSending ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Link gönderiliyor…
                  </>
                ) : (
                  'E-postama sıfırlama linki gönder'
                )}
              </button>

              <button
                type="submit"
                disabled={submitting || linkSending || !formReady}
                className={`w-full inline-flex items-center justify-center gap-2 ${personnelAuthSecondaryBtnClass}`}
              >
                {submitting ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Talep gönderiliyor…
                  </>
                ) : (
                  'Yöneticiye talep ilet'
                )}
              </button>

              <p className={`text-center ${personnelAuthMutedTextClass}`}>
                <button
                  type="button"
                  onClick={() => {
                    setView('no-email');
                    setError('');
                    setMaskedEmail(null);
                  }}
                  className={`${personnelAuthLinkClass} bg-transparent border-0 p-0 cursor-pointer`}
                >
                  E-postamı hatırlamıyorum
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
