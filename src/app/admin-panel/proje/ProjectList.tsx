import strings from '@json/src/app/admin-panel/proje/ProjectList.json';
import {
  FiMapPin,
  FiArrowUpRight,
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiHash,
} from 'react-icons/fi';
import { format, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { formatString } from '@/lib/strings/format';
import type { Project, ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';

const statusStyles: Record<ProjectStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  planned: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  paused: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  archived: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400',
};

function formatDateSafe(value: string | null) {
  if (!value) return strings.emptyDate;
  const d = parseISO(value);
  return isValid(d) ? format(d, 'dd MMM yyyy', { locale: tr }) : strings.emptyDate;
}

export default function ProjectList({
  projects,
  loading,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  loading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{strings.emptyTitle}</p>
        <p className="text-sm text-slate-500 mt-1">{strings.emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <article
          key={project.id}
          className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all flex flex-col"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{project.name}</h3>
              {project.code && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <FiHash className="w-3 h-3" />
                  {project.code}
                </p>
              )}
            </div>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[project.status]}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>

          <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400 flex-1">
            {project.location && (
              <p className="flex items-center gap-2 truncate">
                <FiMapPin className="w-4 h-4 shrink-0" />
                {project.location}
              </p>
            )}
            <p className="text-xs text-slate-500">
              {formatString(strings.startDate, { date: formatDateSafe(project.start_date) })}
            </p>
            <p className="flex items-center gap-2">
              <FiUsers className="w-4 h-4" />
              {formatString(strings.employeeCount, {
                active: project.active_employee_count ?? 0,
                total: project.employee_count ?? 0,
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => router.push(`/admin-panel/proje/${project.id}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              {strings.open}
              <FiArrowUpRight className="w-4 h-4" />
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(project.id)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label={strings.editAriaLabel}
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(project.id)}
                className="p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                aria-label={strings.deleteAriaLabel}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
