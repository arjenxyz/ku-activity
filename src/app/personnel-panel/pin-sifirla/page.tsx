'use client';


import { Suspense } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useSearchParams } from 'next/navigation';
import { PinResetPageContent } from '@/components/auth/PinResetPageContent';

function PinResetRoute() {
  const searchParams = useSearchParams();
  const token = searchParams.get('k') ?? '';
  return <PinResetPageContent token={token} />;
}

export default function PersonnelPinResetPage() {

  const strings = useRegistryStrings('app/personnel-panel/pin-sifirla/page');
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center text-white/60">{strings.loading}</div>
      }
    >
      <PinResetRoute />
    </Suspense>
  );
}
