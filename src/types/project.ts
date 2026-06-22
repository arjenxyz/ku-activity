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
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Aktif',
  planned: 'Planlanan',
  paused: 'Durduruldu',
  completed: 'Tamamlandı',
  archived: 'Arşivlendi',
};
