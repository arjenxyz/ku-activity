'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiLock } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
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

function UnlockForm({
  fullName,
  firstName,
}: {
  fullName: string;
  firstName: string;
}) {
  const strings = useRegistryStrings('app/personnel-panel/unlock/page');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('forgot') === '1') setForgotOpen(true);
  }, [searchParams]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== PERSONNEL_PIN_LENGTH) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/personnel/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ pin }),
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
    }
  };

  const handleForgetMe = async () => {
    if (!window.confirm(strings.forgetMeConfirm)) return;
    await fetch('/api/auth/personnel/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.replace('/personnel-panel/login');
  };

  const displayName = fullName || firstName;

  return (
    <>
      <div className="mb-6 text-center">
        <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {formatString(strings.greeting, { name: displayName.toLocaleUpperCase('tr-TR') })}
        </p>
      </div>

      <form onSubmit={(e) => void handleUnlock(e)} className="space-y-5">
        <div>
          <label className={`${personnelAuthLabelClass} text-center block mb-3`}>
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
            className={`${personnelAuthLinkClass} bg-transparent border-0 p-0 cursor-pointer text-xs`}
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
              <FiLock className="w-4 h-4" />
              {strings.unlockButton}
            </>
          )}
        </button>
      </form>

      <div className={`mt-6 flex justify-end ${personnelAuthFooterTextClass}`}>
        <button
          type="button"
          onClick={() => void handleForgetMe()}
          className={`${personnelAuthLinkClass} bg-transparent border-0 p-0 cursor-pointer text-xs`}
        >
          {strings.forgetMe}
        </button>
      </div>

      <ForgotPinModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}

function UnlockContent() {
  const strings = useRegistryStrings('app/personnel-panel/unlock/page');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ firstName: string; fullName: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/personnel/unlock', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (cancelled) return;
        if (res.status === 401) {
          router.replace('/personnel-panel/login');
          return;
        }
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = (await res.json()) as {
          unlocked?: boolean;
          firstName?: string;
          fullName?: string;
        };
        if (data.unlocked) {
          const next = searchParams.get('next');
          router.replace(next && next.startsWith('/personnel-panel') ? next : '/personnel-panel');
          return;
        }
        setProfile({
          firstName: data.firstName ?? '',
          fullName: data.fullName ?? '',
        });
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <PersonnelLoginLayout dense screenLabel={strings.screenLabel} subtitle={strings.subtitle}>
      {loading || !profile ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <LoadingSpinner />
          <p className="text-sm">{strings.checking}</p>
        </div>
      ) : (
        <UnlockForm fullName={profile.fullName} firstName={profile.firstName} />
      )}
    </PersonnelLoginLayout>
  );
}

export default function PersonnelUnlockPage() {
  const strings = useRegistryStrings('app/personnel-panel/unlock/page');
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center text-white/60">
          {strings.checking}
        </div>
      }
    >
      <UnlockContent />
    </Suspense>
  );
}
