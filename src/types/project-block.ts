export type ProjectBlockStatus = 'active' | 'completed';

export type ProjectBlock = {
  id: string;
  project_id: string;
  name: string;
  status: ProjectBlockStatus;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectTeam = {
  id: string;
  project_id: string;
  name: string;
  block_id: string | null;
  current_job_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  employee_id: string;
  created_at: string;
};

export type TeamWithMembers = ProjectTeam & {
  members: Array<{ id: string; employee_id: string; name: string }>;
  block_name?: string | null;
  job_name?: string | null;
};

export type BlockProfitSummary = {
  block: ProjectBlock;
  jobs: import('@/types/project-job').JobProfitSummary[];
  laborCostApproved: number;
  advancesCost: number;
  deductionsCost: number;
  materialCost: number;
  contractTotal: number;
  totalCostApproved: number;
  profitApproved: number;
  profitPerShare: number;
  approvedWorkDays: number;
  pendingWorkDays: number;
  teams: Array<{ id: string; name: string }>;
};

export const PROJECT_BLOCK_STATUS_LABELS: Record<ProjectBlockStatus, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
};
