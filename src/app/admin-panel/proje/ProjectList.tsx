'use client';

import strings from '@json/src/app/admin-panel/proje/ProjectList.json';
import {
  FiMapPin,
  FiArrowRight,
  FiUsers,
  FiEdit2,
  FiArchive,
  FiHash,
  FiCalendar,
} from 'react-icons/fi';
import { format, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { formatString } from '@/lib/strings/format';
import type { Project, ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';
import { shouldShowProjectClosureCard } from '@/lib/closure-phase';
import { ProjectClosureListCard } from '@/components/admin/ProjectClosureListCard';
import { HonorIconTile, type HonorIconTheme } from '@/components/icons/HonorIcons';

const statusBadge: Record<ProjectStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  planned: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  paused: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  completed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  archived: 'bg-slate-50 text-slate-500 ring-slate-400/20',
};

const statusDot: Record<ProjectStatus, string> = {
  active: 'bg-emerald-500',
  planned: 'bg-amber-500',
  paused: 'bg-slate-400',
  completed: 'bg-blue-500',
  archived: 'bg-slate-300',
};

const statusTile: Record<ProjectStatus, HonorIconTheme> = {
  active: 'emerald',
  planned: 'amber',
  paused: 'slate',
  completed: 'blue',
  archived: 'slate',
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200/60" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <HonorIconTile name="briefcase" theme="indigo" size="xl" />
        <p className="mt-4 text-lg font-semibold text-[#0E1548]">{strings.emptyTitle}</p>
        <p className="mt-1 text-sm text-slate-500">{strings.emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        if (shouldShowProjectClosureCard(project)) {
          return <ProjectClosureListCard key={project.id} project={project} />;
        }

        return (
          <article
            key={project.id}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-[#0E1548]/15"
          >
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <HonorIconTile name="briefcase" theme={statusTile[project.status]} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-[15px] font-bold leading-tight text-[#0E1548]">
                    {project.name}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusBadge[project.status]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`} />
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
                {project.code && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <FiHash className="h-3 w-3" />
                    {project.code}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2 px-4 pb-1 sm:px-5">
              <InfoRow icon={<FiMapPin className="h-4 w-4" />}>
                {project.location || <span className="text-slate-400">{strings.emptyDate}</span>}
              </InfoRow>
              <InfoRow icon={<FiCalendar className="h-4 w-4" />}>
                {formatString(strings.startDate, { date: formatDateSafe(project.start_date) })}
              </InfoRow>
              <InfoRow icon={<FiUsers className="h-4 w-4" />}>
                {formatString(strings.employeeCount, {
                  active: project.active_employee_count ?? 0,
                  total: project.employee_count ?? 0,
                })}
              </InfoRow>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 p-3 sm:px-4">
              <button
                type="button"
                onClick={() => router.push(`/admin-panel/proje/${project.id}`)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152060]"
              >
                {strings.open}
                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(project.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-[#0E1548]"
                  aria-label={strings.editAriaLabel}
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(project.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 text-amber-600 transition hover:bg-amber-50"
                  aria-label={strings.deleteAriaLabel}
                >
                  <FiArchive className="h-4 w-4" />
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 truncate text-sm text-slate-600">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{children}</span>
    </p>
  );
}
