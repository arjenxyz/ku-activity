'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProjectClosureSummary } from '@/lib/project-closure-service';
import { isProjectInClosure } from '@/lib/closure-phase';

export type AdminProjectClosureStatus = ProjectClosureSummary & {
  inClosure: boolean;
  projectName?: string;
};

export function useAdminProjectClosure(projectId: string | null) {
  const [status, setStatus] = useState<AdminProjectClosureStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));

  const reload = useCallback(async () => {
    if (!projectId) {
      setStatus(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/closure/status`, { cache: 'no-store' });
      if (res.ok) {
        setStatus((await res.json()) as AdminProjectClosureStatus);
      } else {
        setStatus(null);
      }
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(Boolean(projectId));
    void reload();
    const id = window.setInterval(() => void reload(), 60_000);
    return () => window.clearInterval(id);
  }, [reload, projectId]);

  return {
    status,
    inClosure: status ? isProjectInClosure(status.phase) : false,
    loading,
    reload,
  };
}
