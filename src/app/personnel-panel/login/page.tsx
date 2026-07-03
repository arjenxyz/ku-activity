'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
  type PendingRegistration,
} from '@/lib/registration-pending-storage';
import {
  hasActivePersonnelSession,
  redirectToPendingApplication,
  redirectToPersonnelPanel,
} from '@/lib/personnel-session-check';
import { FiLock } from 'react-icons/fi';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { useAuthReport } from '@/components/auth/AuthReportContext';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { PERSONNEL_PIN_LENGTH, sanitizePersonnelPinInput } from '@/lib/personnel-pin';
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
  const searchParams = useSearchParams();
  const { setFormError } = useAuthReport();
  const [identityNumber, setIdentityNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        setError(data.error || `Giriş başarısız (${res.status})`);
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
      setError('Sistem hatası — lütfen tekrar deneyin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4" {...personnelLoginFormProps}>
        <div>
          <label htmlFor="personnel-tc" className={labelClass}>
            T.C. Kimlik No
          </label>
          <input
            id="personnel-tc"
            className={inputClass}
            data-sensitive-capture
            placeholder="11 haneli T.C. kimlik numarası"
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
            Giriş PIN
          </label>
          <input
            id="personnel-pin"
            className={`${inputClass} pin-mask`}
            data-sensitive-capture
            placeholder={`${PERSONNEL_PIN_LENGTH} haneli PIN`}
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
              Giriş yapılıyor…
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4 opacity-90" />
              Giriş Yap
            </>
          )}
        </button>
      </form>
      <div
        className={`mt-5 ${personnelAuthDividerClass} space-y-2 text-center ${personnelAuthFooterTextClass}`}
      >
        <p>
          Hesabınız mı yok?{' '}
          <Link href="/personnel-panel/basvuru" prefetch className={personnelAuthLinkClass}>
            Başvuru yapın
          </Link>
        </p>
        <p>
          <Link href="/personnel-panel/sifremi-unuttum" className={personnelAuthLinkClass}>
            Şifremi unuttum
          </Link>
        </p>
      </div>
    </>
  );
}

function PersonnelLoginContent() {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const active = await hasActivePersonnelSession();
      if (cancelled) return;
      if (active) {
        redirectToPersonnelPanel();
        return;
      }

      const pending = loadPendingRegistration();
      if (pending) {
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
      }

      setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PersonnelLoginLayout
      dense
      screenLabel="Personel Giriş"
      subtitle="T.C. kimlik numaranız ve PIN ile giriş yapın."
    >
      {checkingSession ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <LoadingSpinner />
          <p className="text-sm">Oturum kontrol ediliyor…</p>
        </div>
      ) : (
        <LoginForm />
      )}
    </PersonnelLoginLayout>
  );
}

export default function PersonnelLogin() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-white/60">Yükleniyor…</div>}>
      <PersonnelLoginContent />
    </Suspense>
  );
}
