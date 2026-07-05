'use client';

import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { PersonnelClosureLoading } from '@/components/personnel/PersonnelClosureLoading';
import { PersonnelClosureScreen } from '@/components/personnel/PersonnelClosureScreen';

export function PersonnelClosureGate({ children }: { children: React.ReactNode }) {
  const { inClosure, loading } = usePersonnelClosure();

  if (loading) {
    return <PersonnelClosureLoading />;
  }

  if (inClosure) {
    return <PersonnelClosureScreen />;
  }

  return <>{children}</>;
}
