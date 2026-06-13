'use client';

import { FiBriefcase, FiClock, FiMapPin } from 'react-icons/fi';
import type { PersonnelProject } from '@/lib/personnel-api';

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  paused: 'Duraklatıldı',
  completed: 'Tamamlandı',
  planning: 'Planlama',
};

type Props = {
  project: PersonnelProject | null | undefined;
  className?: string;
};

export function PersonnelProjectMenuBar({ project, className = '' }: Props) {
  if (!project) return null;

  const formatTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);
  const start = formatTime(project.workStartTime);
  const end = formatTime(project.workEndTime);
  const hours = start || end ? `${start ?? '—'}${end ? ` – ${end}` : ''}` : null;

  return (
    <div
      className={`rounded-xl border border-indigo-100/80 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-slate-800/90 px-3 sm:px-4 py-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-xs sm:text-sm min-w-0">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-white shrink-0">
          <FiBriefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate max-w-[10rem] sm:max-w-none">{project.name}</span>
        </span>

        {project.code && (
          <>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline" aria-hidden>
              ·
            </span>
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Kod: {project.code}</span>
          </>
        )}

        <span className="text-slate-300 dark:text-slate-600 hidden sm:inline" aria-hidden>
          ·
        </span>
        <span className="text-emerald-700 dark:text-emerald-400 font-medium shrink-0">
          {STATUS_LABELS[project.status] ?? project.status}
        </span>

        {hours && (
          <>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0">
              <FiClock className="w-3 h-3" />
              {hours}
            </span>
          </>
        )}

        {project.location && (
          <>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 min-w-0">
              <FiMapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{project.location}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
