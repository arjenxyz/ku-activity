'use client';


import { useEffect } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/auth/AuthAlerts';

/** Eski URL — giriş ekranında PIN sıfırlama modalına yönlendir */
export default function PersonnelForgotPasswordRedirectPage() {

  const strings = useRegistryStrings('app/personnel-panel/sifremi-unuttum/page');
  const router = useRouter();

  useEffect(() => {
    router.replace('/personnel-panel/login?forgot=1');
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#e7eef8] text-slate-600">
      <LoadingSpinner />
      <p className="text-sm">{strings.redirecting}</p>
    </div>
  );
}
