import type { Project, ProjectFormData, ProjectStatus } from '@/types/project';
import type { AdminProjectQuota } from '@/lib/project-admin-quota';
import { DEMO_WRITE_BLOCKED_MESSAGE, isAdminDemoMode } from '@/lib/demo/demo-paths';
import {
  DEMO_ADMIN_PROJECT,
  DEMO_ADMIN_QUOTA,
  getDemoAdminProjects,
} from '@/lib/demo/admin-demo-data';

type ListFilter = 'all' | ProjectStatus;

async function parseError(res: Response) {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || res.statusText;
}

function demoWriteBlocked(): never {
  throw new Error(DEMO_WRITE_BLOCKED_MESSAGE);
}

export const fetchProjects = async (
  filter: ListFilter = 'all',
  searchTerm: string = ''
): Promise<{ projects: Project[]; quota: AdminProjectQuota | null }> => {
  if (isAdminDemoMode()) {
    let projects = getDemoAdminProjects();
    if (filter !== 'all') projects = projects.filter((p) => p.status === filter);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code ?? '').toLowerCase().includes(q) ||
          (p.location ?? '').toLowerCase().includes(q)
      );
    }
    return { projects, quota: DEMO_ADMIN_QUOTA };
  }

  const params = new URLSearchParams();
  if (filter !== 'all') params.set('filter', filter);
  if (searchTerm) params.set('search', searchTerm);

  const res = await fetch(`/api/admin/projects?${params}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return {
    projects: data.projects ?? [],
    quota: (data.quota as AdminProjectQuota | undefined) ?? null,
  };
};

export const fetchProjectQuota = async (): Promise<AdminProjectQuota> => {
  if (isAdminDemoMode()) return DEMO_ADMIN_QUOTA;
  const { quota } = await fetchProjects();
  if (!quota) {
    return { operationalCount: 0, limit: 2, canCreate: true };
  }
  return quota;
};

export const fetchProjectById = async (id: string): Promise<Project | null> => {
  if (isAdminDemoMode()) {
    return DEMO_ADMIN_PROJECT;
  }
  const res = await fetch(`/api/admin/projects/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.project ?? null;
};

export const createProject = async (project: ProjectFormData): Promise<Project> => {
  if (isAdminDemoMode()) demoWriteBlocked();
  const res = await fetch('/api/admin/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.project;
};

export const updateProject = async (
  id: string,
  project: Partial<ProjectFormData>
): Promise<Project> => {
  if (isAdminDemoMode()) demoWriteBlocked();
  const res = await fetch(`/api/admin/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.project;
};

export const deleteProject = async (id: string): Promise<void> => {
  if (isAdminDemoMode()) demoWriteBlocked();
  const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
};

export const startProjectClosure = async (
  id: string
): Promise<{ deadlineAt: string; notifiedCount: number }> => {
  if (isAdminDemoMode()) demoWriteBlocked();
  const res = await fetch(`/api/admin/projects/${id}/closure/start`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return {
    deadlineAt: String(data.deadlineAt ?? ''),
    notifiedCount: Number(data.notifiedCount ?? 0),
  };
};

/** Arka plan: süresi dolmuş kapanış projelerini siler. UI'yı bloklamaz. */
export const purgeExpiredProjectsInBackground = async (): Promise<{
  projectsPurged: number;
}> => {
  if (isAdminDemoMode()) return { projectsPurged: 0 };
  const res = await fetch('/api/admin/projects/purge-expired', {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) {
    return { projectsPurged: 0 };
  }
  const data = (await res.json().catch(() => ({}))) as { projectsPurged?: number };
  return { projectsPurged: Number(data.projectsPurged ?? 0) };
};
