'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiLoader, FiX } from 'react-icons/fi';
import { AuthAlert } from '@/components/auth/AuthAlerts';
import { TurkishPhoneInput } from '@/components/forms/TurkishPhoneInput';
import { buildPersonnelPinResetUrl } from '@/lib/app-url';
import {
  personnelAuthInfoBannerClass,
  personnelAuthInputClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthMutedTextClass,
  personnelAuthPrimaryBtnClass,
  personnelAuthSecondaryBtnClass,
} from '@/lib/personnel-auth-ui';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/components/auth/ForgotPinModal.json';

type View = 'form' | 'no-email' | 'link-sent';

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
  const [verifying, setVerifying] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const busy = verifying || linkSending || hintLoading;

  const resetState = useCallback(() => {
    setView('form');
    setPhone('');
    setEmail('');
    setError('');
    setMaskedEmail(null);
    setVerifying(false);
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
      };
      if (!res.ok) throw new Error(data.error || strings.verifyFailed);
      if (!data.resetToken) throw new Error(strings.sessionStartFailed);
      handleClose();
      window.location.assign(buildPersonnelPinResetUrl(data.resetToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.verifyFailed);
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
      if (!res.ok) throw new Error(data.error || strings.linkSendFailed);
      setView('link-sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.linkSendFailed);
    } finally {
      setLinkSending(false);
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
      if (!res.ok) throw new Error(data.error || strings.queryFailed);
      setMaskedEmail(data.maskedEmail ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.queryFailed);
    } finally {
      setHintLoading(false);
    }
  };

  const subtitle =
    view === 'no-email'
      ? strings.subtitleNoEmail
      : view === 'link-sent'
        ? strings.subtitleLinkSent
        : strings.subtitleForm;

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
              {strings.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={strings.close}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {view === 'link-sent' ? (
            <div className="space-y-4">
              <AuthAlert type="success" tone="personnel" message={strings.linkSentMessage} />
              <button type="button" onClick={handleClose} className={personnelAuthPrimaryBtnClass}>
                {strings.ok}
              </button>
            </div>
          ) : view === 'no-email' ? (
            <div className="space-y-4">
              <div className={personnelAuthMutedTextClass.replace('text-xs', 'text-sm')}>
                <p className="mb-2">{strings.noEmailHint}</p>
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-tc-hint">
                  {strings.tcLabel}
                </label>
                <input
                  id="forgot-pin-tc-hint"
                  className={inputClass}
                  data-sensitive-capture
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder={strings.tcPlaceholder}
                  maxLength={11}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-phone-hint">
                  {strings.phoneLabel}
                </label>
                <TurkishPhoneInput
                  id="forgot-pin-phone-hint"
                  value={phone}
                  onChange={setPhone}
                  allowCountryCodeSelect
                  placeholder={strings.phonePlaceholder}
                />
              </div>

              {maskedEmail ? (
                <p className={personnelAuthInfoBannerClass}>
                  {formatString(strings.maskedEmailHint, { maskedEmail })}
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
                      {strings.checking}
                    </>
                  ) : (
                    strings.showRegisteredEmail
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
                  {strings.rememberedEmail}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="forgot-pin-tc">
                  {strings.tcLabelRequired}
                </label>
                <input
                  id="forgot-pin-tc"
                  className={inputClass}
                  data-sensitive-capture
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder={strings.tcPlaceholder}
                  maxLength={11}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-phone">
                  {strings.phoneLabelRequired}
                </label>
                <TurkishPhoneInput
                  id="forgot-pin-phone"
                  value={phone}
                  onChange={setPhone}
                  allowCountryCodeSelect
                  placeholder={strings.phonePlaceholder}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="forgot-pin-email">
                  {strings.emailLabel}
                </label>
                <input
                  id="forgot-pin-email"
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={strings.emailPlaceholder}
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
                    {strings.verifying}
                  </>
                ) : (
                  strings.verifyAndContinue
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
                    {strings.sendingLink}
                  </>
                ) : (
                  strings.sendResetLink
                )}
              </button>

              <p className={`text-center ${personnelAuthMutedTextClass}`}>{strings.linkRateHint}</p>

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
                  {strings.forgotEmail}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
