'use client';

import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { PersonnelClosureScreen } from '@/components/personnel/PersonnelClosureScreen';

export function PersonnelClosureGate({ children }: { children: React.ReactNode }) {
  const { inClosure, loading } = usePersonnelClosure();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-4">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (inClosure) {
    return <PersonnelClosureScreen />;
  }

  return <>{children}</>;
}
