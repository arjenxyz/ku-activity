'use client';

import { FiClock, FiMapPin, FiBriefcase } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import type { PersonnelProject } from '@/lib/personnel-api';
import { formatString } from '@/lib/strings/format';

type Props = {
  project: PersonnelProject | null | undefined;
};

export function PersonnelProjectCard({ project }: Props) {

  const strings = useRegistryStrings('components/personnel/PersonnelProjectCard');
  if (!project) return null;

  const formatTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);
  const start = formatTime(project.workStartTime);
  const end = formatTime(project.workEndTime);
  const statusLabel =
    strings.status[project.status as keyof typeof strings.status] ?? project.status;

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/90 to-white dark:from-slate-800 dark:to-slate-900 p-4 sm:p-5 shadow-sm h-full">
      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
        <FiBriefcase className="w-4 h-4" />
        {strings.sectionTitle}
      </p>
      <p className="text-lg font-bold text-slate-900 dark:text-white mt-2 leading-snug">
        {project.name}
      </p>
      {project.code && (
        <p className="text-xs text-slate-500 mt-0.5">
          {formatString(strings.codePrefix, { code: project.code })}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
          {statusLabel}
        </span>
        {(start || end) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
            <FiClock className="w-3 h-3" />
            {start}
            {end ? ` – ${end}` : ''}
          </span>
        )}
      </div>
      {project.location && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 flex items-start gap-1.5">
          <FiMapPin className="w-4 h-4 shrink-0 mt-0.5" />
          {project.location}
        </p>
      )}
      {project.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
          {project.description}
        </p>
      )}
    </div>
  );
}
