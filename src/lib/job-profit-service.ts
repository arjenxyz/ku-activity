import type { SupabaseClient } from '@supabase/supabase-js';
import { buildProfitOverview } from '@/lib/job-profit';
import type { ProjectJob, ProjectJobExpense, ProjectPartner, ProjectProfitOverview } from '@/types/project-job';
import type { WorkLog } from '@/lib/personnel-stats';

type WorkLogRow = WorkLog & {
  employee_id: string;
  job_id: string | null;
  employees: { daily_wage: number } | { daily_wage: number }[] | null;
};

type DeductionRow = {
  job_id: string | null;
  type: string;
  amount: number;
};

function dailyWageFromJoin(row: WorkLogRow): number {
  const emp = row.employees;
  if (!emp) return 0;
  if (Array.isArray(emp)) return Number(emp[0]?.daily_wage ?? 0);
  return Number(emp.daily_wage ?? 0);
}

export async function loadProjectProfitOverview(
  admin: SupabaseClient,
  projectId: string
): Promise<ProjectProfitOverview> {
  const [
    { data: settingsRow },
    { data: partners },
    { data: jobs },
    { data: workLogs },
    { data: deductions },
    { data: expenses },
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
      .from('work_logs')
      .select('*, employees(daily_wage)')
      .eq('project_id', projectId)
      .not('job_id', 'is', null),
    admin
      .from('deductions')
      .select('job_id, type, amount')
      .eq('project_id', projectId)
      .not('job_id', 'is', null),
    admin
      .from('project_job_expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false }),
  ]);

  const settings = settingsRow ?? {
    project_id: projectId,
    share_count: 1,
    updated_at: new Date().toISOString(),
  };

  const workLogsByJobId = new Map<string, Array<WorkLog & { employee_id: string; daily_wage: number }>>();
  for (const row of (workLogs ?? []) as WorkLogRow[]) {
    if (!row.job_id) continue;
    const list = workLogsByJobId.get(row.job_id) ?? [];
    list.push({
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
    });
    workLogsByJobId.set(row.job_id, list);
  }

  const deductionsByJobId = new Map<string, Array<{ type: string; amount: number }>>();
  for (const row of (deductions ?? []) as DeductionRow[]) {
    if (!row.job_id) continue;
    const list = deductionsByJobId.get(row.job_id) ?? [];
    list.push({ type: row.type, amount: Number(row.amount) });
    deductionsByJobId.set(row.job_id, list);
  }

  const expensesByJobId = new Map<string, ProjectJobExpense[]>();
  for (const row of (expenses ?? []) as ProjectJobExpense[]) {
    const list = expensesByJobId.get(row.job_id) ?? [];
    list.push(row);
    expensesByJobId.set(row.job_id, list);
  }

  return buildProfitOverview({
    settings,
    partners: (partners ?? []) as ProjectPartner[],
    jobs: (jobs ?? []) as ProjectJob[],
    workLogsByJobId,
    deductionsByJobId,
    expensesByJobId,
  });
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
