import { supabase } from '../../lib/supabaseClient';
import type { Project } from './types';
import type { ProjectFormData } from './types';

export const fetchProjects = async (
  filter: string = 'all', 
  searchTerm: string = ''
): Promise<Project[]> => {
  try {
    let query = supabase
      .from('projects')
      .select('*')
      .order('start_date', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fetch projects failed:', error);
    throw new Error('Projeler alınırken hata oluştu');
  }
};

export const createProject = async (project: ProjectFormData) => {
  // 1. Projeyi ekle
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (projectError) {
    console.error('Supabase create error:', projectError);
    throw new Error(projectError.message || 'Proje oluşturulamadı');
  }

  // 2. Dashboard kaydını oluştur
  const { error: dashboardError } = await supabase
    .from('project_dashboards')
    .insert({
      project_id: projectData.id,
      config: {
        widgets: [],
        layout: {},
      },
    });

  if (dashboardError) {
    console.error('Dashboard create error:', dashboardError);
    throw new Error(dashboardError.message || 'Dashboard oluşturulamadı');
  }

  // 3. Oluşturulan proje bilgisini döndür
  return projectData;
};

export const updateProject = async (id: string, project: Partial<Project>) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Update project failed:', error);
    throw new Error('Proje güncellenirken hata oluştu');
  }
};

export const deleteProject = async (id: string) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Delete project failed:', error);
    throw new Error('Proje silinirken hata oluştu');
  }
};
