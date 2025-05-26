// src/api/projects.ts

import { supabase } from '../app/lib/supabaseClient';
import type { Project } from '@/types/adminTypes';

export const fetchProject = async (projectId: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  return error ? null : (data as Project);
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>
): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);
  return { error };
};

export const deleteProjectWithDependencies = async (
  projectId: string
): Promise<{ error: any }> => {
  const { error } = await supabase.rpc('delete_project', {
    p_id: projectId
  });
  return { error };
};

// Alias export: deleteProject olarak da kullanılabilir
export const deleteProject = deleteProjectWithDependencies;
