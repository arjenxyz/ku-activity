'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchProjectEmployees, type ProjectEmployee } from '@/lib/project-api';
import strings from '@json/src/hooks/useProjectEmployees.json';

export function useProjectEmployees(projectId: string | undefined) {
  const [employees, setEmployees] = useState<ProjectEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectEmployees(projectId);
      setEmployees(data.filter((e) => e.is_active));
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { employees, loading, error, reload };
}
