import type { Project, ProjectFormData, ProjectStatus } from '@/types/project';

type ListFilter = 'all' | ProjectStatus;

async function parseError(res: Response) {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || res.statusText;
}

export const fetchProjects = async (
  filter: ListFilter = 'all',
  searchTerm: string = ''
): Promise<Project[]> => {
  const params = new URLSearchParams();
  if (filter !== 'all') params.set('filter', filter);
  if (searchTerm) params.set('search', searchTerm);

  const res = await fetch(`/api/admin/projects?${params}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.projects ?? [];
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
