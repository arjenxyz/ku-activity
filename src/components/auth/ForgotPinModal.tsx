'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
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
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type View = 'form' | 'no-email' | 'link-sent';

type Props = {
  open: boolean;
  onClose: () => void;
  initialTc?: string;
};

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;

export function ForgotPinModal({ open, onClose, initialTc = '' }: Props) {

  const strings = useRegistryStrings('components/auth/ForgotPinModal');
  useBodyScrollLock(open);
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-pin-title"
    >
      <div className="flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-28px_rgba(14,21,72,0.45)]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 pb-3 pt-5">
          <div>
            <h2 id="forgot-pin-title" className="text-lg font-semibold tracking-tight text-[#0E1548]">
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

        <div className="px-5 py-4 overflow-y-auto overscroll-none space-y-4" data-allow-scroll>
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
    </div>,
    document.body
  );
}
