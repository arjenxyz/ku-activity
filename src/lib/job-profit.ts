import { computeGrossPay, type WorkLog } from '@/lib/personnel-stats';
import type {
  JobProfitSummary,
  ProjectJob,
  ProjectJobExpense,
  ProjectProfitOverview,
} from '@/types/project-job';

export function computeContractTotal(job: Pick<ProjectJob, 'unit_price' | 'quantity'>): number {
  return Number(job.unit_price) * Number(job.quantity);
}

type WorkLogWithWage = WorkLog & {
  employee_id: string;
  daily_wage: number;
};

type JobDeduction = {
  type: string;
  amount: number;
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

function splitDeductionCosts(deductions: JobDeduction[]) {
  let advancesCost = 0;
  let deductionsCost = 0;
  for (const d of deductions) {
    const amount = Number(d.amount);
    if (d.type === 'advance') advancesCost += amount;
    else deductionsCost += amount;
  }
  return { advancesCost, deductionsCost };
}

export function summarizeJobProfit(params: {
  job: ProjectJob;
  workLogs: WorkLogWithWage[];
  deductions: JobDeduction[];
  expenses: ProjectJobExpense[];
  shareCount: number;
}): JobProfitSummary {
  const { job, workLogs, deductions, expenses, shareCount } = params;
  const contractTotal = computeContractTotal(job);
  const laborCostApproved = laborCostForLogs(workLogs, true);
  const laborCostPending = laborCostForLogs(workLogs, false);
  const { advancesCost, deductionsCost } = splitDeductionCosts(deductions);
  const materialCost = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const personnelCostApproved = laborCostApproved + advancesCost + deductionsCost;
  const personnelCostPending = laborCostPending + advancesCost + deductionsCost;
  const totalCostApproved = personnelCostApproved + materialCost;
  const totalCostPending = personnelCostPending + materialCost;
  const profitApproved = contractTotal - totalCostApproved;
  const profitPending = contractTotal - totalCostPending;
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
    advancesCost,
    deductionsCost,
    materialCost,
    totalCostApproved,
    totalCostPending,
    profitApproved,
    profitPending,
    approvedWorkDays,
    pendingWorkDays,
    shareCount: shares,
    profitPerShareApproved: profitApproved / shares,
    profitPerSharePending: profitPending / shares,
    expenses,
  };
}

export function buildProfitOverview(params: {
  settings: { project_id: string; share_count: number; updated_at: string };
  partners: ProjectProfitOverview['partners'];
  jobs: ProjectJob[];
  workLogsByJobId: Map<string, WorkLogWithWage[]>;
  deductionsByJobId: Map<string, JobDeduction[]>;
  expensesByJobId: Map<string, ProjectJobExpense[]>;
}): ProjectProfitOverview {
  const shareCount = Math.max(1, params.settings.share_count);
  const summaries = params.jobs.map((job) =>
    summarizeJobProfit({
      job,
      workLogs: params.workLogsByJobId.get(job.id) ?? [],
      deductions: params.deductionsByJobId.get(job.id) ?? [],
      expenses: params.expensesByJobId.get(job.id) ?? [],
      shareCount,
    })
  );

  const contractTotal = summaries.reduce((s, j) => s + j.contractTotal, 0);
  const laborCostApproved = summaries.reduce((s, j) => s + j.laborCostApproved, 0);
  const advancesCost = summaries.reduce((s, j) => s + j.advancesCost, 0);
  const deductionsCost = summaries.reduce((s, j) => s + j.deductionsCost, 0);
  const materialCost = summaries.reduce((s, j) => s + j.materialCost, 0);
  const totalCostApproved = summaries.reduce((s, j) => s + j.totalCostApproved, 0);
  const profitApproved = contractTotal - totalCostApproved;

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
      advancesCost,
      deductionsCost,
      materialCost,
      totalCostApproved,
      profitApproved,
      profitPerShareApproved: profitApproved / shareCount,
      shareCount,
    },
  };
}
