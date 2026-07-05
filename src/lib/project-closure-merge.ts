import { createAdminClient } from '@/utils/supabase/admin';

/** Liste yanıtına kapanış alanlarını service role ile ekle (view/RLS eksikliğine karşı). */
export async function mergeProjectClosureFields(
  projects: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  if (!projects.length) return projects;

  try {
    const admin = createAdminClient();
    const ids = projects.map((p) => String(p.id));
    const { data, error } = await admin
      .from('projects')
      .select(
        'id, closure_phase, closure_started_at, closure_deadline_at, closure_fast_path_deadline_at'
      )
      .in('id', ids);

    if (error || !data) return projects;

    const map = new Map(data.map((row) => [row.id as string, row]));
    return projects.map((project) => {
      const closure = map.get(String(project.id));
      return closure ? { ...project, ...closure } : project;
    });
  } catch {
    return projects;
  }
}
