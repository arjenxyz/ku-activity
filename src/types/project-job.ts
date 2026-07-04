import strings from '@json/src/types/project-job.json';

export type ProjectJobStatus = 'active' | 'completed';

export type ProjectJob = {
  id: string;
  project_id: string;
  name: string;
  unit_label: string;
  unit_price: number;
  quantity: number;
  status: ProjectJobStatus;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
  block_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectPartner = {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type ProjectProfitSettings = {
  project_id: string;
  share_count: number;
  updated_at: string;
};

export type ProjectJobExpense = {
  id: string;
  project_id: string;
  job_id: string;
  date: string;
  amount: number;
  description: string | null;
  created_at: string;
};

export type JobProfitSummary = {
  job: ProjectJob;
  contractTotal: number;
  laborCostApproved: number;
  laborCostPending: number;
  advancesCost: number;
  deductionsCost: number;
  materialCost: number;
  totalCostApproved: number;
  totalCostPending: number;
  profitApproved: number;
  profitPending: number;
  approvedWorkDays: number;
  pendingWorkDays: number;
  shareCount: number;
  profitPerShareApproved: number;
  profitPerSharePending: number;
  expenses: ProjectJobExpense[];
};

export type ProjectProfitOverview = {
  settings: ProjectProfitSettings;
  partners: ProjectPartner[];
  jobs: JobProfitSummary[];
  totals: {
    contractTotal: number;
    laborCostApproved: number;
    advancesCost: number;
    deductionsCost: number;
    materialCost: number;
    totalCostApproved: number;
    profitApproved: number;
    profitPerShareApproved: number;
    shareCount: number;
  };
};

export type ExtendedProfitOverview = ProjectProfitOverview & {
  blocks: import('@/types/project-block').ProjectBlock[];
  teams: import('@/types/project-block').TeamWithMembers[];
  blockSummaries: import('@/types/project-block').BlockProfitSummary[];
  teamsWithoutBlock: Array<{ id: string; name: string; member_count: number }>;
};

export const PROJECT_JOB_STATUS_LABELS: Record<ProjectJobStatus, string> =
  strings.statusLabels as Record<ProjectJobStatus, string>;
