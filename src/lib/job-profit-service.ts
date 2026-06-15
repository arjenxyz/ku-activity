import type { SupabaseClient } from '@supabase/supabase-js';
import { buildBlockSummaries } from '@/lib/block-profit';
import { buildProfitOverview } from '@/lib/job-profit';
import { getTeamsWithoutBlock } from '@/lib/team-work-guard';
import type { ProjectBlock, ProjectTeam, TeamWithMembers } from '@/types/project-block';
import type {
  ExtendedProfitOverview,
  ProjectJob,
  ProjectJobExpense,
  ProjectPartner,
} from '@/types/project-job';
import type { WorkLog } from '@/lib/personnel-stats';

type WorkLogRow = WorkLog & {
  employee_id: string;
  job_id: string | null;
  block_id: string | null;
  employees: { daily_wage: number; name?: string } | { daily_wage: number; name?: string }[] | null;
};

type DeductionRow = {
  job_id: string | null;
  block_id: string | null;
  type: string;
  amount: number;
};

function dailyWageFromJoin(row: WorkLogRow): number {
  const emp = row.employees;
  if (!emp) return 0;
  if (Array.isArray(emp)) return Number(emp[0]?.daily_wage ?? 0);
  return Number(emp.daily_wage ?? 0);
}

function mapWorkLog(row: WorkLogRow) {
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    mesai_type: row.mesai_type,
    mesai_units: row.mesai_units,
    description: row.description,
    approved: row.approved,
    admin_confirmed_at: row.admin_confirmed_at,
    employee_confirmed_at: row.employee_confirmed_at,
    employee_dispute_note: row.employee_dispute_note,
    employee_disputed_at: row.employee_disputed_at,
    employee_id: row.employee_id,
    daily_wage: dailyWageFromJoin(row),
  };
}

export async function loadProjectProfitOverview(
  admin: SupabaseClient,
  projectId: string
): Promise<ExtendedProfitOverview> {
  const [
    { data: settingsRow },
    { data: partners },
    { data: jobs },
    { data: blocks },
    { data: teamsRaw },
    { data: workLogs },
    { data: deductions },
    { data: expenses },
    teamsWithoutBlock,
  ] = await Promise.all([
    admin
      .from('project_profit_settings')
      .select('project_id, share_count, updated_at')
      .eq('project_id', projectId)
      .maybeSingle(),
    admin
      .from('project_partners')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
    admin
      .from('project_jobs')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    admin
      .from('project_blocks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    admin
      .from('project_teams')
      .select(
        '*, project_blocks(name), project_jobs:current_job_id(name), team_members(id, employee_id, employees(name))'
      )
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
    admin
      .from('work_logs')
      .select('*, employees(daily_wage)')
      .eq('project_id', projectId),
    admin.from('deductions').select('job_id, block_id, type, amount').eq('project_id', projectId),
    admin
      .from('project_job_expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false }),
    getTeamsWithoutBlock(admin, projectId),
  ]);

  const settings = settingsRow ?? {
    project_id: projectId,
    share_count: 1,
    updated_at: new Date().toISOString(),
  };

  const jobList = (jobs ?? []) as ProjectJob[];
  const jobBlockMap = new Map(jobList.map((j) => [j.id, j.block_id]));

  const workLogsByJobId = new Map<string, ReturnType<typeof mapWorkLog>[]>();
  const workLogsByBlockId = new Map<string, ReturnType<typeof mapWorkLog>[]>();

  for (const row of (workLogs ?? []) as WorkLogRow[]) {
    const mapped = mapWorkLog(row);
    if (row.job_id) {
      const list = workLogsByJobId.get(row.job_id) ?? [];
      list.push(mapped);
      workLogsByJobId.set(row.job_id, list);
    }
    if (row.block_id) {
      const list = workLogsByBlockId.get(row.block_id) ?? [];
      list.push(mapped);
      workLogsByBlockId.set(row.block_id, list);
    }
  }

  const deductionsByJobId = new Map<string, Array<{ type: string; amount: number }>>();
  const deductionsByBlockId = new Map<string, Array<{ type: string; amount: number }>>();

  for (const row of (deductions ?? []) as DeductionRow[]) {
    const item = { type: row.type, amount: Number(row.amount) };
    const blockId = row.block_id ?? (row.job_id ? jobBlockMap.get(row.job_id) : null);
    if (row.job_id) {
      const list = deductionsByJobId.get(row.job_id) ?? [];
      list.push(item);
      deductionsByJobId.set(row.job_id, list);
    }
    if (blockId) {
      const list = deductionsByBlockId.get(blockId) ?? [];
      list.push(item);
      deductionsByBlockId.set(blockId, list);
    }
  }

  const expensesByJobId = new Map<string, ProjectJobExpense[]>();
  for (const row of (expenses ?? []) as ProjectJobExpense[]) {
    const list = expensesByJobId.get(row.job_id) ?? [];
    list.push(row);
    expensesByJobId.set(row.job_id, list);
  }

  const overview = buildProfitOverview({
    settings,
    partners: (partners ?? []) as ProjectPartner[],
    jobs: jobList,
    workLogsByJobId,
    deductionsByJobId,
    expensesByJobId,
  });

  const teams: TeamWithMembers[] = ((teamsRaw ?? []) as Array<Record<string, unknown>>).map(
    (t) => {
      const blockJoin = t.project_blocks as { name: string } | { name: string }[] | null;
      const jobJoin = t.project_jobs as { name: string } | { name: string }[] | null;
      const membersRaw = t.team_members as Array<{
        id: string;
        employee_id: string;
        employees: { name: string } | { name: string }[] | null;
      }> | null;

      const blockName = Array.isArray(blockJoin) ? blockJoin[0]?.name : blockJoin?.name;
      const jobName = Array.isArray(jobJoin) ? jobJoin[0]?.name : jobJoin?.name;

      return {
        id: t.id as string,
        project_id: t.project_id as string,
        name: t.name as string,
        block_id: (t.block_id as string | null) ?? null,
        current_job_id: (t.current_job_id as string | null) ?? null,
        sort_order: t.sort_order as number,
        created_at: t.created_at as string,
        updated_at: t.updated_at as string,
        block_name: blockName ?? null,
        job_name: jobName ?? null,
        members: (membersRaw ?? []).map((m) => ({
          id: m.id,
          employee_id: m.employee_id,
          name: Array.isArray(m.employees) ? m.employees[0]?.name ?? '—' : m.employees?.name ?? '—',
        })),
      };
    }
  );

  const blockSummaries = buildBlockSummaries({
    blocks: (blocks ?? []) as ProjectBlock[],
    jobSummaries: overview.jobs,
    workLogsByBlockId,
    deductionsByBlockId,
    teams: teams as ProjectTeam[],
    shareCount: overview.settings.share_count,
  });

  return {
    ...overview,
    blocks: (blocks ?? []) as ProjectBlock[],
    teams,
    blockSummaries,
    teamsWithoutBlock,
  };
}

export async function ensureProfitSettings(
  admin: SupabaseClient,
  projectId: string,
  shareCount: number
) {
  const count = Math.max(1, Math.min(20, Math.floor(shareCount)));
  const { data, error } = await admin
    .from('project_profit_settings')
    .upsert({ project_id: projectId, share_count: count }, { onConflict: 'project_id' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}
