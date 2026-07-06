'use client';

import { usePathname } from 'next/navigation';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { PersonnelClosureLoading } from '@/components/personnel/PersonnelClosureLoading';
import { PersonnelClosureScreen } from '@/components/personnel/PersonnelClosureScreen';

function bypassesClosureGate(pathname: string) {
  return pathname.startsWith('/personnel-panel/kapanis/hizlandirma');
}

export function PersonnelClosureGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { inClosure, loading } = usePersonnelClosure();

  if (bypassesClosureGate(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return <PersonnelClosureLoading />;
  }

  if (inClosure) {
    return <PersonnelClosureScreen />;
  }

  return <>{children}</>;
}
