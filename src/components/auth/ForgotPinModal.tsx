'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiLoader, FiLock, FiX } from 'react-icons/fi';
import { AuthAlert } from '@/components/auth/AuthAlerts';
import { TurkishPhoneInput } from '@/components/forms/TurkishPhoneInput';
import {
  PERSONNEL_PIN_LENGTH,
  sanitizePersonnelPinInput,
  validatePersonnelPinMatch,
} from '@/lib/personnel-pin';
import {
  personnelAuthInfoBannerClass,
  personnelAuthInputClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthMutedTextClass,
  personnelAuthPrimaryBtnClass,
  personnelAuthSecondaryBtnClass,
} from '@/lib/personnel-auth-ui';

type View = 'form' | 'set-pin' | 'no-email' | 'link-sent' | 'done';

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
  const [resetToken, setResetToken] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const busy = verifying || savingPin || linkSending || hintLoading;

  const resetState = useCallback(() => {
    setView('form');
    setPhone('');
    setEmail('');
    setResetToken('');
    setEmployeeName('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setMaskedEmail(null);
    setVerifying(false);
    setSavingPin(false);
    setLinkSending(false);
    setHintLoading(false);
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
      if (e.key === 'Escape' && !busy) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, handleClose]);

  const formReady =
    tcKimlik.replace(/\D/g, '').length === 11 && phone.trim().length > 0 && email.trim().length > 0;

  const pinReady =
    newPin.length === PERSONNEL_PIN_LENGTH && confirmPin.length === PERSONNEL_PIN_LENGTH;

  const handleVerify = async () => {
    if (verifying || !formReady) return;
    setError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/public/personnel-pin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-reset',
          tcKimlik,
          phone,
          email,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        resetToken?: string;
        employeeName?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Doğrulama başarısız');
      if (!data.resetToken) throw new Error('Oturum başlatılamadı');
      setResetToken(data.resetToken);
      setEmployeeName(data.employeeName ?? '');
      setView('set-pin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doğrulama başarısız');
    } finally {
      setVerifying(false);
    }
  };

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

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPin || !resetToken) return;
    setError('');
    const pinError = validatePersonnelPinMatch(newPin, confirmPin);
    if (pinError) {
      setError(pinError);
      return;
    }
    setSavingPin(true);
    try {
      const res = await fetch('/api/public/personnel-pin-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'PIN kaydedilemedi');
      setView('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN kaydedilemedi');
    } finally {
      setSavingPin(false);
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

  const subtitle =
    view === 'no-email'
      ? 'E-postanızı hatırlamıyorsanız aşağıdaki seçenekleri kullanın.'
      : view === 'link-sent'
        ? 'E-postanızı kontrol edin.'
        : view === 'set-pin'
          ? 'Yeni giriş PIN\'inizi belirleyin.'
          : view === 'done'
            ? 'PIN güncellendi.'
            : 'Kimliğinizi doğrulayın, ardından yeni PIN\'inizi siz belirleyin.';

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
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {view === 'done' ? (
            <div className="space-y-4">
              <AuthAlert
                type="success"
                tone="personnel"
                message="Yeni PIN'iniz kaydedildi. Artık giriş ekranından yeni PIN'inizle oturum açabilirsiniz."
              />
              <button type="button" onClick={handleClose} className={personnelAuthPrimaryBtnClass}>
                Giriş ekranına dön
              </button>
            </div>
          ) : view === 'link-sent' ? (
            <div className="space-y-4">
              <AuthAlert
                type="success"
                tone="personnel"
                message="Sıfırlama linki e-posta adresinize gönderildi. Bağlantı 30 dakika geçerlidir; linke tıklayarak yeni PIN'inizi belirleyebilirsiniz."
              />
              <button type="button" onClick={handleClose} className={personnelAuthPrimaryBtnClass}>
                Tamam
              </button>
            </div>
          ) : view === 'set-pin' ? (
            <form onSubmit={(e) => void handleSavePin(e)} className="space-y-4">
              {employeeName ? (
                <p className={personnelAuthInfoBannerClass}>
                  Merhaba <strong>{employeeName}</strong>, kimliğiniz doğrulandı. Yeni PIN&apos;inizi
                  girin.
                </p>
              ) : null}

              <div>
                <label className={labelClass} htmlFor="forgot-pin-new">
                  Yeni PIN *
                </label>
                <input
                  id="forgot-pin-new"
                  className={`${inputClass} pin-mask`}
                  data-sensitive-capture
                  value={newPin}
                  onChange={(e) => setNewPin(sanitizePersonnelPinInput(e.target.value))}
                  placeholder={`${PERSONNEL_PIN_LENGTH} haneli PIN`}
                  maxLength={PERSONNEL_PIN_LENGTH}
                  inputMode="numeric"
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-confirm">
                  Yeni PIN tekrar *
                </label>
                <input
                  id="forgot-pin-confirm"
                  className={`${inputClass} pin-mask`}
                  data-sensitive-capture
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(sanitizePersonnelPinInput(e.target.value))}
                  placeholder={`${PERSONNEL_PIN_LENGTH} haneli PIN`}
                  maxLength={PERSONNEL_PIN_LENGTH}
                  inputMode="numeric"
                  required
                />
              </div>

              {error ? <AuthAlert type="error" tone="personnel" message={error} /> : null}

              <button
                type="submit"
                disabled={savingPin || !pinReady}
                className={personnelAuthPrimaryBtnClass}
              >
                {savingPin ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Kaydediliyor…
                  </>
                ) : (
                  <>
                    <FiLock className="w-4 h-4 opacity-90" />
                    Yeni PIN&apos;i kaydet
                  </>
                )}
              </button>
            </form>
          ) : view === 'no-email' ? (
            <div className="space-y-4">
              <div className={personnelAuthMutedTextClass.replace('text-xs', 'text-sm')}>
                <p className="mb-2">
                  E-posta adresinizi hatırlamıyorsanız <strong>şantiye yöneticinize</strong> veya{' '}
                  <strong>İK biriminize</strong> başvurun. T.C. kimlik ve telefon bilgilerinizle
                  kayıtlı e-postanızı öğrenebilirsiniz.
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
                  Hatırladıysanız tam adresi girerek devam edebilirsiniz.
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
            <div className="space-y-4">
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
                />
              </div>

              {error ? <AuthAlert type="error" tone="personnel" message={error} /> : null}

              <button
                type="button"
                onClick={() => void handleVerify()}
                disabled={verifying || linkSending || !formReady}
                className={personnelAuthPrimaryBtnClass}
              >
                {verifying ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Doğrulanıyor…
                  </>
                ) : (
                  'Doğrula ve yeni PIN belirle'
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleSendLink()}
                disabled={linkSending || verifying || !formReady}
                className={`w-full inline-flex items-center justify-center gap-2 ${personnelAuthSecondaryBtnClass}`}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
