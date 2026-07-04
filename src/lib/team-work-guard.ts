import type { SupabaseClient } from '@supabase/supabase-js';
import strings from '@json/src/lib/team-work-guard.json';
import { formatString } from '@/lib/strings/format';

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
    throw new Error(formatString(strings.noActiveBlock, { teamName: team.name }));
  }

  const { data: block } = await admin
    .from('project_blocks')
    .select('status, name')
    .eq('id', team.block_id)
    .maybeSingle();

  if (!block || block.status !== 'active') {
    throw new Error(
      formatString(strings.blockCompleted, {
        teamName: team.name,
        blockName: block?.name ?? '—',
      })
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
