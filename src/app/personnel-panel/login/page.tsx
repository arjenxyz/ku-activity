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
} from '@/lib/personnel-auth-ui';

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;

function PersonnelLoginContent() {
  const searchParams = useSearchParams();
  const [identityType, setIdentityType] = useState<'tc' | 'foreign'>('tc');
  const [identityNumber, setIdentityNumber] = useState('');
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
  }, [searchParams]);

  if (checkingSession) {
    return (
      <PersonnelLoginLayout>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/60">
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

      if (data.pending) {
        const pending: PendingRegistration = {
          verificationCode: data.verificationCode,
          approvalUrl: data.approvalUrl,
          identityType: data.identityType,
          identityNumber: data.identityNumber,
          tcKimlik: data.tcKimlik,
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
    <PersonnelLoginLayout
      subtitle="Kimlik numaranız ve PIN ile giriş yapın. Onay bekleyen başvurular da aynı bilgilerle durum ekranına yönlendirilir."
    >
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

        {error && <AuthAlert message={error} type="error" tone="glass" />}

        <button
          type="submit"
          disabled={
            isLoading ||
            (identityType === 'tc' ? identityNumber.length !== 11 : identityNumber.trim().length < 5) ||
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
              <FiLock className="w-4 h-4" />
              Giriş Yap
            </>
          )}
        </button>
      </form>
      <div className={`mt-4 space-y-2 text-center ${personnelAuthFooterTextClass}`}>
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
