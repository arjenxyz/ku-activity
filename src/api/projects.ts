import type { Project, ProjectFormData } from '@/types/project';
import {
  fetchProjectById,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
} from '@/app/lib/proje/projectService';

export const fetchProject = fetchProjectById;

export const updateProject = async (
  projectId: string,
  updates: Partial<ProjectFormData>
): Promise<{ error: Error | null }> => {
  try {
    await updateProjectApi(projectId, updates);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Güncelleme başarısız') };
  }
};

export const deleteProject = async (
  projectId: string
): Promise<{ error: Error | null }> => {
  try {
    await deleteProjectApi(projectId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Silme başarısız') };
  }
};

export type { Project };
