'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loadPendingRegistration } from '@/lib/registration-pending-storage';
import { hasActivePersonnelSession, redirectToPersonnelPanel } from '@/lib/personnel-session-check';
import { FiLock } from 'react-icons/fi';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { PERSONNEL_PIN_LENGTH, sanitizePersonnelPinInput } from '@/lib/personnel-pin';
import {
  loginPinInputProps,
  loginTcInputProps,
  personnelLoginFormProps,
} from '@/components/auth/loginFormProps';

const inputClass =
  'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

function PersonnelLoginContent() {
  const searchParams = useSearchParams();
  const [identityType, setIdentityType] = useState<'tc' | 'foreign'>('tc');
  const [identityNumber, setIdentityNumber] = useState('');
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('tc');
    if (fromUrl) {
      setIdentityType('tc');
      setIdentityNumber(fromUrl.replace(/\D/g, '').slice(0, 11));
    } else {
      const pending = loadPendingRegistration();
      if (pending?.identityNumber) {
        setIdentityType(pending.identityType === 'foreign' ? 'foreign' : 'tc');
        setIdentityNumber(pending.identityNumber);
      } else if (pending?.tcKimlik) {
        setIdentityType('tc');
        setIdentityNumber(pending.tcKimlik);
      }
    }
    setHasPendingApplication(Boolean(loadPendingRegistration()));
  }, [searchParams]);

  if (checkingSession) {
    return (
      <PersonnelLoginLayout>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <LoadingSpinner />
          <p className="text-sm">Oturum kontrol ediliyor…</p>
        </div>
      </PersonnelLoginLayout>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/personnel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          identityType,
          identityNumber,
          tcKimlik: identityType === 'tc' ? identityNumber.replace(/\D/g, '') : undefined,
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Giriş başarısız (${res.status})`);
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
    <PersonnelLoginLayout>
      <form onSubmit={handleLogin} className="space-y-5" {...personnelLoginFormProps}>
        <div>
          <label htmlFor="personnel-tc" className={labelClass}>
            {identityType === 'tc' ? 'T.C. Kimlik No' : 'Yabancı Kimlik / Pasaport No'}
          </label>
          <select
            className={`${inputClass} mb-2`}
            value={identityType}
            onChange={(e) => {
              setIdentityType(e.target.value as 'tc' | 'foreign');
              setIdentityNumber('');
            }}
          >
            <option value="tc">T.C. Kimlik No</option>
            <option value="foreign">Yabancı Kimlik / Pasaport</option>
          </select>
          <input
            id="personnel-tc"
            className={inputClass}
            placeholder={identityType === 'tc' ? '11 haneli T.C. kimlik' : 'Yabancı kimlik / pasaport no'}
            maxLength={identityType === 'tc' ? 11 : 20}
            value={identityNumber}
            onChange={(e) =>
              setIdentityNumber(
                identityType === 'tc'
                  ? e.target.value.replace(/\D/g, '').slice(0, 11)
                  : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
              )
            }
            required
            data-lpignore="true"
            data-1p-ignore="true"
            {...loginTcInputProps}
          />
        </div>

        <div>
          <label htmlFor="personnel-pin" className={labelClass}>
            Giriş şifresi (PIN)
          </label>
          <input
            id="personnel-pin"
            className={`${inputClass} pin-mask`}
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

        {error && <AuthAlert message={error} type="error" />}

        <button
          type="submit"
          disabled={
            isLoading ||
            (identityType === 'tc' ? identityNumber.length !== 11 : identityNumber.trim().length < 5) ||
            password.length !== PERSONNEL_PIN_LENGTH
          }
          className="touch-target w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Giriş yapılıyor…
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4" />
              Giriş Yap
            </>
          )}
        </button>
      </form>
      <div className="mt-4 space-y-2 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          {hasPendingApplication ? (
            <>
              Onay bekleyen başvurunuz var.{' '}
              <Link href="/personnel-panel/basvuru" className="text-blue-600 font-semibold hover:underline">
                QR kodunu görüntüle
              </Link>
            </>
          ) : (
            <>
              Hesabınız mı yok?{' '}
              <Link href="/personnel-panel/basvuru" prefetch className="text-blue-600 font-semibold hover:underline">
                Başvuru yapın
              </Link>
            </>
          )}
        </p>
        <p>
          <Link href="/personnel-panel/sifremi-unuttum" className="text-blue-600 font-semibold hover:underline">
            Şifremi unuttum
          </Link>
        </p>
      </div>
    </PersonnelLoginLayout>
  );
}

export default function PersonnelLogin() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-slate-500">Yükleniyor…</div>}>
      <PersonnelLoginContent />
    </Suspense>
  );
}
