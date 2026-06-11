import type { ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';

const styles: Record<ProjectStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  planned: 'bg-amber-50 text-amber-800 border-amber-200',
  paused: 'bg-slate-100 text-slate-700 border-slate-200',
  completed: 'bg-blue-50 text-blue-800 border-blue-200',
  archived: 'bg-slate-50 text-slate-500 border-slate-200',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${styles[status]}`}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
