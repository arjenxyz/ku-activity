import { computeGrossPay, type WorkLog } from '@/lib/personnel-stats';
import type { JobProfitSummary, ProjectJob, ProjectProfitOverview } from '@/types/project-job';

export function computeContractTotal(job: Pick<ProjectJob, 'unit_price' | 'quantity'>): number {
  return Number(job.unit_price) * Number(job.quantity);
}

type WorkLogWithWage = WorkLog & {
  employee_id: string;
  daily_wage: number;
};

function laborCostForLogs(logs: WorkLogWithWage[], approvedOnly: boolean): number {
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

export function summarizeJobProfit(
  job: ProjectJob,
  workLogs: WorkLogWithWage[],
  shareCount: number
): JobProfitSummary {
  const contractTotal = computeContractTotal(job);
  const laborCostApproved = laborCostForLogs(workLogs, true);
  const laborCostPending = laborCostForLogs(workLogs, false);
  const profitApproved = contractTotal - laborCostApproved;
  const profitPending = contractTotal - laborCostPending;
  const shares = Math.max(1, shareCount);

  const approvedWorkDays = workLogs
    .filter((w) => w.approved === true)
    .reduce((s, w) => s + Number(w.amount), 0);
  const pendingWorkDays = workLogs
    .filter((w) => w.approved !== true)
    .reduce((s, w) => s + Number(w.amount), 0);

  return {
    job,
    contractTotal,
    laborCostApproved,
    laborCostPending,
    profitApproved,
    profitPending,
    approvedWorkDays,
    pendingWorkDays,
    shareCount: shares,
    profitPerShareApproved: profitApproved / shares,
    profitPerSharePending: profitPending / shares,
  };
}

export function buildProfitOverview(params: {
  settings: { project_id: string; share_count: number; updated_at: string };
  partners: ProjectProfitOverview['partners'];
  jobs: ProjectJob[];
  workLogsByJobId: Map<string, WorkLogWithWage[]>;
}): ProjectProfitOverview {
  const shareCount = Math.max(1, params.settings.share_count);
  const summaries = params.jobs.map((job) =>
    summarizeJobProfit(job, params.workLogsByJobId.get(job.id) ?? [], shareCount)
  );

  const contractTotal = summaries.reduce((s, j) => s + j.contractTotal, 0);
  const laborCostApproved = summaries.reduce((s, j) => s + j.laborCostApproved, 0);
  const profitApproved = contractTotal - laborCostApproved;

  return {
    settings: {
      project_id: params.settings.project_id,
      share_count: shareCount,
      updated_at: params.settings.updated_at,
    },
    partners: params.partners,
    jobs: summaries,
    totals: {
      contractTotal,
      laborCostApproved,
      profitApproved,
      profitPerShareApproved: profitApproved / shareCount,
      shareCount,
    },
  };
}
