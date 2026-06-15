import type { SupabaseClient } from '@supabase/supabase-js';

export async function assertEmployeeTeamHasActiveBlock(
  admin: SupabaseClient,
  employeeId: string,
  projectId: string
): Promise<void> {
  const { data: member } = await admin
    .from('team_members')
    .select('team_id')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!member?.team_id) return;

  const { data: team } = await admin
    .from('project_teams')
    .select('id, name, block_id, project_id')
    .eq('id', member.team_id)
    .eq('project_id', projectId)
    .maybeSingle();

  if (!team) return;

  if (!team.block_id) {
    throw new Error(
      `"${team.name}" ekibine aktif blok atanmamış. Ekipler sayfasından blok atayın.`
    );
  }

  const { data: block } = await admin
    .from('project_blocks')
    .select('status, name')
    .eq('id', team.block_id)
    .maybeSingle();

  if (!block || block.status !== 'active') {
    throw new Error(
      `"${team.name}" ekibinin bloğu (${block?.name ?? '—'}) tamamlanmış. Yeni blok oluşturup ekibe atayın.`
    );
  }
}

export async function getTeamsWithoutBlock(
  admin: SupabaseClient,
  projectId: string
): Promise<Array<{ id: string; name: string; member_count: number }>> {
  const { data: teams } = await admin
    .from('project_teams')
    .select('id, name, block_id, team_members(id)')
    .eq('project_id', projectId);

  return (teams ?? [])
    .filter((t) => !t.block_id)
    .map((t) => ({
      id: t.id as string,
      name: t.name as string,
      member_count: Array.isArray(t.team_members) ? t.team_members.length : 0,
    }));
}
