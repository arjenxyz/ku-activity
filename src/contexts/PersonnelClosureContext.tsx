'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PersonnelClosureStatus } from '@/lib/project-closure-dossier';

type PersonnelClosureContextValue = {
  status: PersonnelClosureStatus | null;
  inClosure: boolean;
  loading: boolean;
  reload: () => Promise<void>;
};

const PersonnelClosureContext = createContext<PersonnelClosureContextValue | null>(null);

export function PersonnelClosureProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PersonnelClosureStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel/closure/status', { cache: 'no-store' });
      if (res.ok) {
        setStatus((await res.json()) as PersonnelClosureStatus);
      } else {
        setStatus(null);
      }
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const intervalMs = status?.isAccelerated ? 5_000 : 60_000;
    const id = window.setInterval(() => void reload(), intervalMs);
    return () => window.clearInterval(id);
  }, [reload, status?.isAccelerated]);

  const value = useMemo(
    () => ({
      status,
      inClosure: status?.inClosure ?? false,
      loading,
      reload,
    }),
    [status, loading, reload]
  );

  return (
    <PersonnelClosureContext.Provider value={value}>{children}</PersonnelClosureContext.Provider>
  );
}

export function usePersonnelClosure() {
  const ctx = useContext(PersonnelClosureContext);
  if (!ctx) {
    throw new Error('usePersonnelClosure must be used within PersonnelClosureProvider');
  }
  return ctx;
}
