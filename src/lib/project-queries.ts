import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectStatus } from '@/types/project';

const VALID_STATUSES: ProjectStatus[] = ['active', 'planned', 'paused', 'completed', 'archived'];

function withStatsDefaults<T extends Record<string, unknown>>(row: T) {
  return {
    employee_count: 0,
    active_employee_count: 0,
    ...row,
  };
}

export async function queryProjectsList(
  supabase: SupabaseClient,
  filter: string,
  search: string
) {
  let viewQuery = supabase
    .from('projects_with_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter !== 'all' && VALID_STATUSES.includes(filter as ProjectStatus)) {
    viewQuery = viewQuery.eq('status', filter);
  }
  if (search) {
    viewQuery = viewQuery.or(`name.ilike.%${search}%,code.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const viewResult = await viewQuery;
  if (!viewResult.error) {
    return { data: viewResult.data ?? [], error: null };
  }

  let tableQuery = supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (filter !== 'all' && VALID_STATUSES.includes(filter as ProjectStatus)) {
    tableQuery = tableQuery.eq('status', filter);
  }
  if (search) {
    tableQuery = tableQuery.ilike('name', `%${search}%`);
  }

  const tableResult = await tableQuery;
  if (tableResult.error) {
    return { data: null, error: tableResult.error };
  }

  return {
    data: (tableResult.data ?? []).map((row) => withStatsDefaults(row as Record<string, unknown>)),
    error: null,
  };
}

export async function queryProjectById(supabase: SupabaseClient, projectId: string) {
  const viewResult = await supabase
    .from('projects_with_stats')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (!viewResult.error && viewResult.data) {
    return { data: viewResult.data, error: null };
  }

  const tableResult = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (tableResult.error || !tableResult.data) {
    return { data: null, error: tableResult.error };
  }

  return { data: withStatsDefaults(tableResult.data as Record<string, unknown>), error: null };
}

export function apiErrorMessage(err: unknown, fallback = 'Sistem hatası') {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') return { status: 401, message: 'Oturum yok veya yönetici yetkisi gerekli' };
    if (err.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return { status: 500, message: 'Sunucu yapılandırması eksik (SERVICE_ROLE_KEY)' };
    }
    return { status: 500, message: err.message };
  }
  return { status: 500, message: fallback };
}
