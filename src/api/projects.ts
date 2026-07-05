import type { Project, ProjectFormData } from '@/types/project';
import {
  fetchProjectById,
  updateProject as updateProjectApi,
  startProjectClosure as startProjectClosureApi,
} from '@/app/lib/proje/projectService';
import strings from '@json/src/api/projects.json';

export const fetchProject = fetchProjectById;

export const updateProject = async (
  projectId: string,
  updates: Partial<ProjectFormData>
): Promise<{ error: Error | null }> => {
  try {
    await updateProjectApi(projectId, updates);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(strings.updateFailed) };
  }
};

export const startProjectClosure = async (
  projectId: string
): Promise<{ error: Error | null; deadlineAt?: string }> => {
  try {
    const result = await startProjectClosureApi(projectId);
    return { error: null, deadlineAt: result.deadlineAt };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(strings.closureFailed) };
  }
};

export type { Project };
