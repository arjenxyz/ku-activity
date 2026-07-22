import strings from '@json/src/types/project.json';

import type { ClosurePhase } from '@/lib/closure-phase';

export type ProjectStatus = 'active' | 'planned' | 'paused' | 'completed' | 'archived';

export type Project = {
  id: string;
  name: string;
  code: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  status: ProjectStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  employee_count?: number;
  active_employee_count?: number;
  work_start_time?: string | null;
  work_end_time?: string | null;
  timezone?: string | null;
  auto_attendance_enabled?: boolean;
  closure_phase?: ClosurePhase | string | null;
  closure_started_at?: string | null;
  closure_deadline_at?: string | null;
  closure_fast_path_deadline_at?: string | null;
  membership?: 'owner' | 'collaborator';
};

export type ProjectFormData = {
  name: string;
  code?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  status: ProjectStatus;
  verificationCode?: string;
  work_start_time?: string;
  work_end_time?: string;
  timezone?: string;
  auto_attendance_enabled?: boolean;
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> =
  strings.statusLabels as Record<ProjectStatus, string>;
