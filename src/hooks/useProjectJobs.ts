'use client';

import { useEffect, useState } from 'react';
import { fetchProjectJobs } from '@/lib/project-api';

export type ProjectJobOption = { id: string; name: string; status: string };

export function useProjectJobs(projectId: string) {
  const [jobs, setJobs] = useState<ProjectJobOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProjectJobs(projectId)
      .then((list) => {
        if (!cancelled) setJobs(list);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { jobs, loading };
}
