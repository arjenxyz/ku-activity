'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiLock } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { PersonnelPinBoxes } from '@/components/personnel/PersonnelPinBoxes';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { ForgotPinModal } from '@/components/auth/ForgotPinModal';
import { PERSONNEL_PIN_LENGTH } from '@/lib/personnel-pin';
import { formatString } from '@/lib/strings/format';
import {
  personnelAuthFooterTextClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthPrimaryBtnClass,
} from '@/lib/personnel-auth-ui';

type Props = {
  fullName: string;
  firstName: string;
};

export function UnlockFormClient({ fullName, firstName }: Props) {
  const strings = useRegistryStrings('app/personnel-panel/unlock/page');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const unlockInFlightRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('forgot') === '1') setForgotOpen(true);
  }, [searchParams]);

  const displayName = (fullName || firstName).trim();

  const submitUnlock = useCallback(
    async (pinValue: string) => {
      if (pinValue.length !== PERSONNEL_PIN_LENGTH || unlockInFlightRef.current) return;
      unlockInFlightRef.current = true;
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/auth/personnel/unlock', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ pin: pinValue }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error || strings.invalidPin);
          setPin('');
          return;
        }
        const next = searchParams.get('next');
        router.replace(next && next.startsWith('/personnel-panel') ? next : '/personnel-panel');
        router.refresh();
      } catch {
        setError(strings.systemError);
      } finally {
        setLoading(false);
        unlockInFlightRef.current = false;
      }
    },
    [router, searchParams, strings.invalidPin, strings.systemError]
  );

  useEffect(() => {
    if (pin.length === PERSONNEL_PIN_LENGTH && !loading) {
      void submitUnlock(pin);
    }
  }, [pin, loading, submitUnlock]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitUnlock(pin);
  };

  const handleForgetMe = async () => {
    if (!window.confirm(strings.forgetMeConfirm)) return;
    await fetch('/api/auth/personnel/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.replace('/personnel-panel/login');
  };

  return (
    <>
      <p className="mb-6 text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {formatString(strings.greeting, { name: displayName.toLocaleUpperCase('tr-TR') })}
      </p>

      <form onSubmit={(e) => void handleUnlock(e)} className="space-y-5">
        <div>
          <label className={`${personnelAuthLabelClass} mb-3 block text-center`}>
            {strings.pinLabel}
          </label>
          <PersonnelPinBoxes
            value={pin}
            onChange={setPin}
            disabled={loading}
            autoFocus
            ariaLabel={strings.pinDigitAria}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className={`${personnelAuthLinkClass} cursor-pointer border-0 bg-transparent p-0 text-xs`}
          >
            {strings.forgotPin}
          </button>
        </div>

        {error ? <AuthAlert message={error} type="error" tone="personnel" /> : null}

        <button
          type="submit"
          disabled={loading || pin.length !== PERSONNEL_PIN_LENGTH}
          className={personnelAuthPrimaryBtnClass}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              {strings.unlocking}
            </>
          ) : (
            <>
              <FiLock className="h-4 w-4" />
              {strings.unlockButton}
            </>
          )}
        </button>
      </form>

      <div className={`mt-6 flex justify-end ${personnelAuthFooterTextClass}`}>
        <button
          type="button"
          onClick={() => void handleForgetMe()}
          className={`${personnelAuthLinkClass} cursor-pointer border-0 bg-transparent p-0 text-xs`}
        >
          {strings.forgetMe}
        </button>
      </div>

      <ForgotPinModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
