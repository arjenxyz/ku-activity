'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';

function LinkConfirmBody() {
  const strings = useRegistryStrings('components/personnel/PersonnelClosureAcceleration');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { reload } = usePersonnelClosure();
  const [message, setMessage] = useState(strings.linkConfirmTitle);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const token = searchParams.get('k');
    if (!token) {
      setOk(false);
      setMessage(strings.linkConfirmError);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/personnel/closure/accelerate-deletion/confirm-link', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ linkToken: token }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || strings.linkConfirmError);
        if (!cancelled) {
          setOk(true);
          setMessage(strings.linkConfirmSuccess);
          await reload();
          router.replace('/personnel-panel');
        }
      } catch (err) {
        if (!cancelled) {
          setOk(false);
          setMessage(err instanceof Error ? err.message : strings.linkConfirmError);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, strings, reload, router]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-6 text-center">
      {ok === null ? (
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      ) : null}
      <p
        className={`mt-4 text-sm font-medium ${
          ok === false ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {message}
      </p>
    </div>
  );
}

export default function ClosureAccelerationConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      }
    >
      <LinkConfirmBody />
    </Suspense>
  );
}
