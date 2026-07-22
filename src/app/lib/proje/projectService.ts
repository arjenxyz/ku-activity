import type { Project, ProjectFormData, ProjectStatus } from '@/types/project';
import type { AdminProjectQuota } from '@/lib/project-admin-quota';

type ListFilter = 'all' | ProjectStatus;

async function parseError(res: Response) {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || res.statusText;
}

export const fetchProjects = async (
  filter: ListFilter = 'all',
  searchTerm: string = ''
): Promise<{ projects: Project[]; quota: AdminProjectQuota | null }> => {
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
  const { quota } = await fetchProjects();
  if (!quota) {
    return { operationalCount: 0, limit: 2, canCreate: true };
  }
  return quota;
};

export const fetchProjectById = async (id: string): Promise<Project | null> => {
  const res = await fetch(`/api/admin/projects/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.project ?? null;
};

export const createProject = async (project: ProjectFormData): Promise<Project> => {
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
  const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
};

export const startProjectClosure = async (
  id: string
): Promise<{ deadlineAt: string; notifiedCount: number }> => {
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
