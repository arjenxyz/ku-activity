'use client';


import { Suspense, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
  type PendingRegistration,
} from '@/lib/registration-pending-storage';
import { redirectToPendingApplication } from '@/lib/personnel-session-check';
import { FiLock } from 'react-icons/fi';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { useAuthReport } from '@/components/auth/AuthReportContext';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { ForgotPinModal } from '@/components/auth/ForgotPinModal';
import { PERSONNEL_PIN_LENGTH, sanitizePersonnelPinInput } from '@/lib/personnel-pin';
import { formatString } from '@/lib/strings/format';
import {
  loginPinInputProps,
  loginTcInputProps,
  personnelLoginFormProps,
} from '@/components/auth/loginFormProps';

import {
  personnelAuthFooterTextClass,
  personnelAuthInputClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthPrimaryBtnClass,
  personnelAuthDividerClass,
} from '@/lib/personnel-auth-ui';

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;

function LoginForm() {
  const strings = useRegistryStrings('app/personnel-panel/login/page');

  const searchParams = useSearchParams();
  const { setFormError } = useAuthReport();
  const [identityNumber, setIdentityNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('forgot') === '1') {
      setForgotOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fromUrl = searchParams.get('tc');
    if (fromUrl) {
      setIdentityNumber(fromUrl.replace(/\D/g, '').slice(0, 11));
      return;
    }
    const pending = loadPendingRegistration();
    if (pending?.identityNumber) {
      setIdentityNumber(pending.identityNumber.replace(/\D/g, '').slice(0, 11));
    } else if (pending?.tcKimlik) {
      setIdentityNumber(pending.tcKimlik.replace(/\D/g, '').slice(0, 11));
    }
  }, [searchParams]);

  useEffect(() => {
    setFormError(error || undefined);
  }, [error, setFormError]);

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();
    setError('');
    setIsLoading(true);

    const tcKimlik = identityNumber.replace(/\D/g, '');

    try {
      const res = await fetch('/api/auth/personnel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          identityType: 'tc',
          identityNumber: tcKimlik,
          tcKimlik,
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || formatString(strings.loginFailedWithStatus, { status: res.status }));
        return;
      }

      if (data.pending) {
        const pending: PendingRegistration = {
          verificationCode: data.verificationCode,
          approvalUrl: data.approvalUrl,
          identityType: 'tc',
          identityNumber: data.identityNumber ?? tcKimlik,
          tcKimlik: data.tcKimlik ?? tcKimlik,
        };
        savePendingRegistration(pending);
        redirectToPendingApplication();
        return;
      }

      window.location.assign('/personnel-panel');
    } catch {
      setError(strings.systemError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4" {...personnelLoginFormProps}>
        <div>
          <label htmlFor="personnel-tc" className={labelClass}>
            {strings.tcKimlikLabel}
          </label>
          <input
            id="personnel-tc"
            className={inputClass}
            data-sensitive-capture
            placeholder={strings.tcKimlikPlaceholder}
            maxLength={11}
            inputMode="numeric"
            value={identityNumber}
            onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
            required
            data-lpignore="true"
            data-1p-ignore="true"
            {...loginTcInputProps}
          />
        </div>

        <div>
          <label htmlFor="personnel-pin" className={labelClass}>
            {strings.pinLabel}
          </label>
          <input
            id="personnel-pin"
            className={`${inputClass} pin-mask`}
            data-sensitive-capture
            placeholder={formatString(strings.pinPlaceholder, { pinLength: PERSONNEL_PIN_LENGTH })}
            maxLength={PERSONNEL_PIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(sanitizePersonnelPinInput(e.target.value))}
            required
            data-lpignore="true"
            data-1p-ignore="true"
            {...loginPinInputProps}
          />
        </div>

        {error && <AuthAlert message={error} type="error" tone="personnel" />}

        <button
          type="submit"
          disabled={
            isLoading ||
            identityNumber.replace(/\D/g, '').length !== 11 ||
            password.length !== PERSONNEL_PIN_LENGTH
          }
          className={personnelAuthPrimaryBtnClass}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              {strings.loggingIn}
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4 opacity-90" />
              {strings.loginButton}
            </>
          )}
        </button>
      </form>
      <div
        className={`mt-5 ${personnelAuthDividerClass} space-y-2 text-center ${personnelAuthFooterTextClass}`}
      >
        <p>
          {strings.noAccountPrompt}{' '}
          <Link href="/personnel-panel/basvuru" prefetch className={personnelAuthLinkClass}>
            {strings.applyLink}
          </Link>
        </p>
        <p>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className={`${personnelAuthLinkClass} bg-transparent border-0 p-0 cursor-pointer`}
          >
            {strings.forgotPin}
          </button>
        </p>
      </div>

      <ForgotPinModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialTc={identityNumber}
      />
    </>
  );
}

function PersonnelLoginContent() {
  const strings = useRegistryStrings('app/personnel-panel/login/page');

  useEffect(() => {
    let cancelled = false;
    const pending = loadPendingRegistration();
    if (!pending) return;

    void (async () => {
      try {
        const res = await fetch(
          `/api/public/personnel-registration/status?kod=${encodeURIComponent(pending.verificationCode)}`
        );
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { status?: string };
          if (data.status === 'pending' || data.status === 'approved' || data.status === 'rejected') {
            savePendingRegistration(pending);
            redirectToPendingApplication();
            return;
          }
        }
        clearPendingRegistration();
      } catch {
        /* giriş formuna devam */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PersonnelLoginLayout dense screenLabel={strings.screenLabel} subtitle={strings.subtitle}>
      <LoginForm />
    </PersonnelLoginLayout>
  );
}

export default function PersonnelLogin() {

  const strings = useRegistryStrings('app/personnel-panel/login/page');
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-white/60">{strings.loading}</div>}>
      <PersonnelLoginContent />
    </Suspense>
  );
}
