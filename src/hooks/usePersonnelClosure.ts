'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PersonnelClosureStatus } from '@/lib/project-closure-dossier';

export function usePersonnelClosure() {
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
    const id = window.setInterval(() => void reload(), 60_000);
    return () => window.clearInterval(id);
  }, [reload]);

  return {
    status,
    inClosure: status?.inClosure ?? false,
    loading,
    reload,
  };
}
