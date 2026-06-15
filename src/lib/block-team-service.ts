import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectBlock, ProjectTeam, TeamWithMembers } from '@/types/project-block';

export async function listProjectBlocks(
  admin: SupabaseClient,
  projectId: string
): Promise<ProjectBlock[]> {
  const { data, error } = await admin
    .from('project_blocks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectBlock[];
}

export async function createProjectBlock(
  admin: SupabaseClient,
  projectId: string,
  params: { name: string; notes?: string | null }
): Promise<ProjectBlock> {
  const { count } = await admin
    .from('project_blocks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { data, error } = await admin
    .from('project_blocks')
    .insert({
      project_id: projectId,
      name: params.name.trim(),
      notes: params.notes?.trim() || null,
      sort_order: count ?? 0,
      status: 'active',
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectBlock;
}

export async function completeProjectBlock(
  admin: SupabaseClient,
  projectId: string,
  blockId: string
): Promise<ProjectBlock> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('project_blocks')
    .update({ status: 'completed', completed_at: now })
    .eq('id', blockId)
    .eq('project_id', projectId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  await admin
    .from('project_teams')
    .update({ block_id: null })
    .eq('project_id', projectId)
    .eq('block_id', blockId);

  return data as ProjectBlock;
}

export async function listProjectTeams(
  admin: SupabaseClient,
  projectId: string
): Promise<TeamWithMembers[]> {
  const { data, error } = await admin
    .from('project_teams')
    .select(
      '*, project_blocks(name), project_jobs:current_job_id(name), team_members(id, employee_id, employees(name))'
    )
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Record<string, unknown>>).map((t) => {
    const blockJoin = t.project_blocks as { name: string } | { name: string }[] | null;
    const jobJoin = t.project_jobs as { name: string } | { name: string }[] | null;
    const membersRaw = t.team_members as Array<{
      id: string;
      employee_id: string;
      employees: { name: string } | { name: string }[] | null;
    }> | null;

    return {
      id: t.id as string,
      project_id: t.project_id as string,
      name: t.name as string,
      block_id: (t.block_id as string | null) ?? null,
      current_job_id: (t.current_job_id as string | null) ?? null,
      sort_order: t.sort_order as number,
      created_at: t.created_at as string,
      updated_at: t.updated_at as string,
      block_name: Array.isArray(blockJoin) ? blockJoin[0]?.name : blockJoin?.name ?? null,
      job_name: Array.isArray(jobJoin) ? jobJoin[0]?.name : jobJoin?.name ?? null,
      members: (membersRaw ?? []).map((m) => ({
        id: m.id,
        employee_id: m.employee_id,
        name: Array.isArray(m.employees) ? m.employees[0]?.name ?? '—' : m.employees?.name ?? '—',
      })),
    };
  });
}

export async function createProjectTeam(
  admin: SupabaseClient,
  projectId: string,
  params: { name: string; blockId?: string | null; currentJobId?: string | null }
): Promise<ProjectTeam> {
  const { count } = await admin
    .from('project_teams')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { data, error } = await admin
    .from('project_teams')
    .insert({
      project_id: projectId,
      name: params.name.trim(),
      block_id: params.blockId ?? null,
      current_job_id: params.currentJobId ?? null,
      sort_order: count ?? 0,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectTeam;
}

export async function updateProjectTeam(
  admin: SupabaseClient,
  projectId: string,
  teamId: string,
  params: {
    name?: string;
    blockId?: string | null;
    currentJobId?: string | null;
  }
): Promise<ProjectTeam> {
  const patch: Record<string, unknown> = {};
  if (params.name !== undefined) patch.name = params.name.trim();
  if (params.blockId !== undefined) patch.block_id = params.blockId;
  if (params.currentJobId !== undefined) patch.current_job_id = params.currentJobId;

  const { data, error } = await admin
    .from('project_teams')
    .update(patch)
    .eq('id', teamId)
    .eq('project_id', projectId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectTeam;
}

export async function addTeamMember(
  admin: SupabaseClient,
  projectId: string,
  teamId: string,
  employeeId: string
): Promise<void> {
  const { data: team } = await admin
    .from('project_teams')
    .select('id')
    .eq('id', teamId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (!team) throw new Error('Ekip bulunamadı');

  const { error } = await admin.from('team_members').insert({
    team_id: teamId,
    employee_id: employeeId,
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error('Bu personel zaten başka bir ekipte.');
    }
    throw new Error(error.message);
  }
}

export async function removeTeamMember(
  admin: SupabaseClient,
  teamId: string,
  memberId: string
): Promise<void> {
  const { error } = await admin.from('team_members').delete().eq('id', memberId).eq('team_id', teamId);
  if (error) throw new Error(error.message);
}

export async function deleteProjectTeam(
  admin: SupabaseClient,
  projectId: string,
  teamId: string
): Promise<void> {
  const { error } = await admin
    .from('project_teams')
    .delete()
    .eq('id', teamId)
    .eq('project_id', projectId);
  if (error) throw new Error(error.message);
}
