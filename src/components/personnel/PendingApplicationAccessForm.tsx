'use client';

import { useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import {
  loginPinInputProps,
  loginTcInputProps,
  personnelLoginFormProps,
} from '@/components/auth/loginFormProps';
import { PERSONNEL_PIN_LENGTH, sanitizePersonnelPinInput } from '@/lib/personnel-pin';
import {
  savePendingRegistration,
  type PendingRegistration,
} from '@/lib/registration-pending-storage';

const inputClass =
  'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

type Props = {
  onSuccess: (pending: PendingRegistration) => void;
  compact?: boolean;
};

export function PendingApplicationAccessForm({ onSuccess, compact = false }: Props) {
  const [identityType, setIdentityType] = useState<'tc' | 'foreign'>('tc');
  const [identityNumber, setIdentityNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/public/personnel-registration/access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identityType, identityNumber, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erişim başarısız');

      const pending: PendingRegistration = {
        verificationCode: data.verificationCode,
        approvalUrl: data.approvalUrl,
        identityType: data.identityType,
        identityNumber: data.identityNumber,
        tcKimlik: data.tcKimlik,
      };
      savePendingRegistration(pending);
      onSuccess(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erişim başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        compact
          ? 'space-y-3'
          : 'rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-4 sm:p-5 space-y-4'
      }
    >
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Onay bekliyorsanız</p>
          <p className="text-xs text-slate-500 mt-1">
            Başvuruda belirlediğiniz kimlik ve PIN ile durumunuzu görün. Panele giriş yapılmaz.
          </p>
        </div>
      )}

      {error && <AuthAlert type="error" message={error} />}

      <form {...personnelLoginFormProps} onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIdentityType('tc')}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
              identityType === 'tc'
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            T.C. Kimlik
          </button>
          <button
            type="button"
            onClick={() => setIdentityType('foreign')}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
              identityType === 'foreign'
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            Yabancı Kimlik
          </button>
        </div>

        <div>
          <label className={labelClass}>
            {identityType === 'tc' ? 'T.C. Kimlik No' : 'Kimlik / Pasaport No'}
          </label>
          <input
            {...loginTcInputProps}
            className={inputClass}
            inputMode={identityType === 'tc' ? 'numeric' : 'text'}
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
          />
        </div>

        <div>
          <label className={labelClass}>PIN</label>
          <input
            {...loginPinInputProps}
            className={inputClass}
            inputMode="numeric"
            maxLength={PERSONNEL_PIN_LENGTH}
            value={pin}
            onChange={(e) => setPin(sanitizePersonnelPinInput(e.target.value))}
            required
          />
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            (identityType === 'tc' ? identityNumber.length !== 11 : identityNumber.length < 5) ||
            pin.length !== PERSONNEL_PIN_LENGTH
          }
          className="touch-target w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold"
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Kontrol ediliyor…
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4" />
              Başvuru durumunu gör
            </>
          )}
        </button>
      </form>
    </div>
  );
}
