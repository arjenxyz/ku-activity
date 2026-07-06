import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectStatus } from '@/types/project';
import strings from '@json/src/lib/project-queries.json';
import { resolveApiError } from '@/lib/safe-api-error';

const VALID_STATUSES: ProjectStatus[] = ['active', 'planned', 'paused', 'completed', 'archived'];

async function attachEmployeeStats(
  supabase: SupabaseClient,
  projects: Record<string, unknown>[]
) {
  if (!projects.length) return projects;

  const ids = projects.map((p) => p.id as string);
  const { data: employees } = await supabase
    .from('employees')
    .select('project_id, is_active')
    .in('project_id', ids);

  const stats = new Map<string, { employee_count: number; active_employee_count: number }>();
  for (const id of ids) {
    stats.set(id, { employee_count: 0, active_employee_count: 0 });
  }
  for (const emp of employees ?? []) {
    const row = emp as { project_id: string; is_active: boolean };
    const bucket = stats.get(row.project_id);
    if (!bucket) continue;
    bucket.employee_count += 1;
    if (row.is_active) bucket.active_employee_count += 1;
  }

  return projects.map((project) => ({
    ...project,
    ...(stats.get(project.id as string) ?? { employee_count: 0, active_employee_count: 0 }),
  }));
}

function applyListFilters(
  supabase: SupabaseClient,
  filter: string,
  search: string
) {
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (filter !== 'all' && VALID_STATUSES.includes(filter as ProjectStatus)) {
    query = query.eq('status', filter);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,location.ilike.%${search}%`);
  }
  return query;
}

async function enrichClosureFields(
  supabase: SupabaseClient,
  projects: Record<string, unknown>[]
) {
  if (!projects.length) return projects;
  const ids = projects.map((p) => p.id as string);
  const { data, error } = await supabase
    .from('projects')
    .select('id, closure_phase, closure_started_at, closure_deadline_at, closure_fast_path_deadline_at')
    .in('id', ids);

  if (error || !data) return projects;

  const map = new Map(data.map((row) => [row.id as string, row]));
  return projects.map((project) => {
    const closure = map.get(project.id as string);
    return closure ? { ...project, ...closure } : project;
  });
}

/** Proje listesi — closure alanları için doğrudan projects tablosu. */
export async function queryProjectsList(
  supabase: SupabaseClient,
  filter: string,
  search: string
) {
  const projectsResult = await applyListFilters(supabase, filter, search);

  if (!projectsResult.error && projectsResult.data) {
    const rows = projectsResult.data as Record<string, unknown>[];
    const withStats = await attachEmployeeStats(supabase, rows);
    return { data: withStats, error: null };
  }

  const viewQuery = supabase
    .from('projects_with_stats')
    .select('*')
    .order('created_at', { ascending: false });
  let filteredView = viewQuery;
  if (filter !== 'all' && VALID_STATUSES.includes(filter as ProjectStatus)) {
    filteredView = filteredView.eq('status', filter);
  }
  if (search) {
    filteredView = filteredView.or(
      `name.ilike.%${search}%,code.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  const viewResult = await filteredView;
  if (!viewResult.error) {
    const rows = (viewResult.data ?? []) as Record<string, unknown>[];
    const enriched = await enrichClosureFields(supabase, rows);
    return { data: enriched, error: null };
  }

  return { data: null, error: projectsResult.error ?? viewResult.error };
}

export async function queryProjectById(supabase: SupabaseClient, projectId: string) {
  const projectResult = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (!projectResult.error && projectResult.data) {
    const [withStats] = await attachEmployeeStats(supabase, [
      projectResult.data as Record<string, unknown>,
    ]);
    return { data: withStats, error: null };
  }

  const viewResult = await supabase
    .from('projects_with_stats')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (!viewResult.error && viewResult.data) {
    const [enriched] = await enrichClosureFields(supabase, [
      viewResult.data as Record<string, unknown>,
    ]);
    return { data: enriched, error: null };
  }

  return { data: null, error: projectResult.error ?? viewResult.error };
}

export function apiErrorMessage(err: unknown, fallback = strings.systemError) {
  return resolveApiError(err, fallback);
}
