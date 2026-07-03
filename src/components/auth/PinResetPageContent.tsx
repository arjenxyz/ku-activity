'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiClock, FiLoader, FiLock } from 'react-icons/fi';
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
  personnelAuthMutedTextClass,
  personnelAuthPrimaryBtnClass,
  personnelAuthSectionClass,
} from '@/lib/personnel-auth-ui';

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

type Props = {
  token: string;
};

export function PinResetPageContent({ token }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiresInMinutes, setExpiresInMinutes] = useState(30);
  const [now, setNow] = useState(() => Date.now());
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
        const data = (await res.json()) as {
          error?: string;
          employeeName?: string;
          expiresAt?: string;
          expiresInMinutes?: number;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || 'Bağlantı geçersiz veya süresi dolmuş.');
          return;
        }
        setValid(true);
        setEmployeeName(data.employeeName ?? '');
        setExpiresAt(data.expiresAt ?? null);
        setExpiresInMinutes(data.expiresInMinutes ?? 30);
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

  useEffect(() => {
    if (!valid || !expiresAt || done) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [valid, expiresAt, done]);

  const remainingMs = useMemo(() => {
    if (!expiresAt) return 0;
    return new Date(expiresAt).getTime() - now;
  }, [expiresAt, now]);

  const expired = valid && remainingMs <= 0;

  useEffect(() => {
    if (expired) {
      setValid(false);
      setError(
        `Bağlantının süresi doldu (${expiresInMinutes} dakika). Giriş ekranından yeni bir sıfırlama linki isteyin.`
      );
    }
  }, [expired, expiresInMinutes]);

  const pinsMatch = newPin.length === PERSONNEL_PIN_LENGTH && newPin === confirmPin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expired || submitting) return;
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
      window.setTimeout(() => router.replace('/personnel-panel/login'), 3000);
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
        <div className="space-y-4">
          <AuthAlert
            type="success"
            tone="personnel"
            message="Yeni PIN'iniz kaydedildi. Bu sıfırlama bağlantısı artık kullanılamaz. Giriş ekranına yönlendiriliyorsunuz…"
          />
          <Link href="/personnel-panel/login" className={`block text-center ${personnelAuthPrimaryBtnClass}`}>
            Giriş ekranına git
          </Link>
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (!valid) {
    return (
      <PersonnelLoginLayout title="Bağlantı geçersiz" subtitle="" screenLabel="PIN Sıfırlama">
        <div className="space-y-4">
          {error ? <AuthAlert type="error" tone="personnel" message={error} /> : null}
          <p className={`text-center ${personnelAuthFooterTextClass}`}>
            <Link href="/personnel-panel/login?forgot=1" className={personnelAuthLinkClass}>
              Yeni sıfırlama linki iste
            </Link>
          </p>
        </div>
      </PersonnelLoginLayout>
    );
  }

  return (
    <PersonnelLoginLayout
      title="Yeni PIN belirle"
      subtitle={
        employeeName
          ? `Merhaba ${employeeName}, yeni giriş PIN'inizi oluşturun.`
          : 'Yeni giriş PIN\'inizi oluşturun.'
      }
      screenLabel="PIN Sıfırlama"
    >
      <div className="space-y-4">
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            remainingMs < 5 * 60 * 1000
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-blue-200 bg-blue-50 text-blue-900'
          }`}
        >
          <FiClock className="h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Kalan süre: {formatCountdown(remainingMs)}</p>
            <p className="text-xs opacity-80 mt-0.5">
              Bağlantı {expiresInMinutes} dakika geçerlidir; süre dolunca otomatik iptal olur.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className={personnelAuthSectionClass}>
          <div>
            <label className={labelClass} htmlFor="reset-new-pin">
              Yeni PIN *
            </label>
            <input
              id="reset-new-pin"
              className={`${inputClass} pin-mask text-center text-lg tracking-[0.35em]`}
              data-sensitive-capture
              value={newPin}
              onChange={(e) => setNewPin(sanitizePersonnelPinInput(e.target.value))}
              placeholder={'•'.repeat(PERSONNEL_PIN_LENGTH)}
              maxLength={PERSONNEL_PIN_LENGTH}
              inputMode="numeric"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="reset-confirm-pin">
              Yeni PIN tekrar *
            </label>
            <input
              id="reset-confirm-pin"
              className={`${inputClass} pin-mask text-center text-lg tracking-[0.35em]`}
              data-sensitive-capture
              value={confirmPin}
              onChange={(e) => setConfirmPin(sanitizePersonnelPinInput(e.target.value))}
              placeholder={'•'.repeat(PERSONNEL_PIN_LENGTH)}
              maxLength={PERSONNEL_PIN_LENGTH}
              inputMode="numeric"
              autoComplete="off"
              required
            />
            {confirmPin.length === PERSONNEL_PIN_LENGTH && !pinsMatch ? (
              <p className={`${personnelAuthMutedTextClass} text-red-600`}>PIN tekrarı eşleşmiyor.</p>
            ) : null}
          </div>

          {error ? <AuthAlert type="error" tone="personnel" message={error} /> : null}

          <button
            type="submit"
            disabled={
              submitting ||
              expired ||
              newPin.length !== PERSONNEL_PIN_LENGTH ||
              confirmPin.length !== PERSONNEL_PIN_LENGTH ||
              !pinsMatch
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
                PIN&apos;i kaydet ve girişe dön
              </>
            )}
          </button>
        </form>
      </div>
    </PersonnelLoginLayout>
  );
}
