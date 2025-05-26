// src/api/projects.ts

import { supabase } from '../app/lib/supabaseClient';
import type { Project } from '@/types/adminTypes';
import type { PostgrestError } from '@supabase/supabase-js';

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
): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);
  return { error };
};

export const deleteProjectWithDependencies = async (
  projectId: string
): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase.rpc('delete_project', {
    p_id: projectId
  });
  return { error };
};

// Alias export
export const deleteProject = deleteProjectWithDependencies;
