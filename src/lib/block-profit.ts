import type { BlockProfitSummary, ProjectBlock, ProjectTeam } from '@/types/project-block';
import type { JobProfitSummary } from '@/types/project-job';
import type { WorkLog } from '@/lib/personnel-stats';
import { computeGrossPay } from '@/lib/personnel-stats';

type WorkLogWithWage = WorkLog & { employee_id: string; daily_wage: number };
type DeductionRow = { type: string; amount: number };

function laborFromLogs(logs: WorkLogWithWage[], approvedOnly: boolean): number {
  const byEmployee = new Map<string, WorkLogWithWage[]>();
  for (const log of logs) {
    const list = byEmployee.get(log.employee_id) ?? [];
    list.push(log);
    byEmployee.set(log.employee_id, list);
  }
  let total = 0;
  for (const employeeLogs of byEmployee.values()) {
    const wage = employeeLogs[0]?.daily_wage ?? 0;
    total += computeGrossPay(employeeLogs, wage, { approvedOnly }).gross;
  }
  return total;
}

function splitDeductions(rows: DeductionRow[]) {
  let advancesCost = 0;
  let deductionsCost = 0;
  for (const d of rows) {
    const amount = Number(d.amount);
    if (d.type === 'advance') advancesCost += amount;
    else deductionsCost += amount;
  }
  return { advancesCost, deductionsCost };
}

export function buildBlockSummaries(params: {
  blocks: ProjectBlock[];
  jobSummaries: JobProfitSummary[];
  workLogsByBlockId: Map<string, WorkLogWithWage[]>;
  deductionsByBlockId: Map<string, DeductionRow[]>;
  teams: ProjectTeam[];
  shareCount: number;
}): BlockProfitSummary[] {
  const jobsByBlock = new Map<string, JobProfitSummary[]>();
  for (const summary of params.jobSummaries) {
    const blockId = summary.job.block_id;
    if (!blockId) continue;
    const list = jobsByBlock.get(blockId) ?? [];
    list.push(summary);
    jobsByBlock.set(blockId, list);
  }

  return params.blocks.map((block) => {
    const blockJobs = jobsByBlock.get(block.id) ?? [];
    const contractTotal = blockJobs.reduce((s, j) => s + j.contractTotal, 0);
    const materialCost = blockJobs.reduce((s, j) => s + j.materialCost, 0);

    const blockLogs = params.workLogsByBlockId.get(block.id) ?? [];
    const laborCostApproved = laborFromLogs(blockLogs, true);
    const approvedWorkDays = blockLogs
      .filter((w) => w.approved === true)
      .reduce((s, w) => s + Number(w.amount), 0);
    const pendingWorkDays = blockLogs
      .filter((w) => w.approved !== true)
      .reduce((s, w) => s + Number(w.amount), 0);

    const blockDeductions = params.deductionsByBlockId.get(block.id) ?? [];
    const { advancesCost, deductionsCost } = splitDeductions(blockDeductions);

    const totalCostApproved = laborCostApproved + advancesCost + deductionsCost + materialCost;
    const profitApproved = contractTotal - totalCostApproved;
    const shares = Math.max(1, params.shareCount);

    return {
      block,
      jobs: blockJobs,
      laborCostApproved,
      advancesCost,
      deductionsCost,
      materialCost,
      contractTotal,
      totalCostApproved,
      profitApproved,
      profitPerShare: profitApproved / shares,
      approvedWorkDays,
      pendingWorkDays,
      teams: params.teams
        .filter((t) => t.block_id === block.id)
        .map((t) => ({ id: t.id, name: t.name })),
    };
  });
}
