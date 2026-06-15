'use client';

import { useEffect, useState } from 'react';
import { fetchProject } from '@/api/projects';
import type { Project } from '@/types/project';

export function useAdminCurrentProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchProject(projectId)
      .then((data) => {
        if (!cancelled) setProject(data);
      })
      .catch(() => {
        if (!cancelled) setProject(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { project, loading, setProject };
}
