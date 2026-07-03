'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiLoader, FiLock } from 'react-icons/fi';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import {
  PERSONNEL_PIN_LENGTH,
  sanitizePersonnelPinInput,
  validatePersonnelPinMatch,
} from '@/lib/personnel-pin';
import {
  personnelAuthFooterTextClass,
  personnelAuthInputClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthPrimaryBtnClass,
} from '@/lib/personnel-auth-ui';

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;

function PinResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('k') ?? '';

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setError('Geçersiz sıfırlama bağlantısı.');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/public/personnel-pin-reset/complete?k=${encodeURIComponent(token)}`
        );
        const data = (await res.json()) as { error?: string; employeeName?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || 'Bağlantı geçersiz veya süresi dolmuş.');
          return;
        }
        setValid(true);
        setEmployeeName(data.employeeName ?? '');
      } catch {
        if (!cancelled) setError('Bağlantı doğrulanamadı.');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pinError = validatePersonnelPinMatch(newPin, confirmPin);
    if (pinError) {
      setError(pinError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/personnel-pin-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'PIN güncellenemedi');
      setDone(true);
      window.setTimeout(() => router.replace('/personnel-panel/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN güncellenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <PersonnelLoginLayout title="PIN sıfırlama" subtitle="" screenLabel="PIN Sıfırlama">
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <LoadingSpinner />
          <p className="text-sm">Bağlantı doğrulanıyor…</p>
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (done) {
    return (
      <PersonnelLoginLayout title="PIN güncellendi" subtitle="" screenLabel="PIN Sıfırlama">
        <AuthAlert
          type="success"
          tone="personnel"
          message="Yeni PIN'iniz kaydedildi. Giriş ekranına yönlendiriliyorsunuz…"
        />
      </PersonnelLoginLayout>
    );
  }

  if (!valid) {
    return (
      <PersonnelLoginLayout title="Bağlantı geçersiz" subtitle="" screenLabel="PIN Sıfırlama">
        {error ? <AuthAlert type="error" tone="personnel" message={error} /> : null}
        <p className={`text-center ${personnelAuthFooterTextClass}`}>
          <Link href="/personnel-panel/login?forgot=1" className={personnelAuthLinkClass}>
            Yeni sıfırlama linki iste
          </Link>
        </p>
      </PersonnelLoginLayout>
    );
  }

  return (
    <PersonnelLoginLayout
      title="Yeni PIN belirle"
      subtitle={employeeName ? `Merhaba ${employeeName}, yeni giriş PIN'inizi oluşturun.` : 'Yeni giriş PIN\'inizi oluşturun.'}
      screenLabel="PIN Sıfırlama"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="reset-new-pin">
            Yeni PIN *
          </label>
          <input
            id="reset-new-pin"
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
          <label className={labelClass} htmlFor="reset-confirm-pin">
            Yeni PIN tekrar *
          </label>
          <input
            id="reset-confirm-pin"
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
          disabled={
            submitting ||
            newPin.length !== PERSONNEL_PIN_LENGTH ||
            confirmPin.length !== PERSONNEL_PIN_LENGTH
          }
          className={personnelAuthPrimaryBtnClass}
        >
          {submitting ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Kaydediliyor…
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4 opacity-90" />
              PIN&apos;i kaydet
            </>
          )}
        </button>
      </form>
    </PersonnelLoginLayout>
  );
}

export default function PersonnelPinResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center text-white/60">Yükleniyor…</div>
      }
    >
      <PinResetContent />
    </Suspense>
  );
}
