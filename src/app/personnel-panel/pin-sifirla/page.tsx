'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PinResetPageContent } from '@/components/auth/PinResetPageContent';

function PinResetRoute() {
  const searchParams = useSearchParams();
  const token = searchParams.get('k') ?? '';
  return <PinResetPageContent token={token} />;
}

export default function PersonnelPinResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center text-white/60">Yükleniyor…</div>
      }
    >
      <PinResetRoute />
    </Suspense>
  );
}
