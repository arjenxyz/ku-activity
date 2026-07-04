import { format, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiMapPin, FiCalendar, FiHash, FiSettings } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import strings from '@json/src/components/project/ProjectDetailHeader.json';

function fmt(date: string | null) {
  if (!date) return strings.emptyValue;
  const d = parseISO(date);
  return isValid(d) ? format(d, 'd MMMM yyyy', { locale: tr }) : strings.emptyValue;
}

export function ProjectDetailHeader({
  project,
  onSettings,
}: {
  project: Project;
  onSettings: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-sm text-slate-600 max-w-2xl">{project.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onSettings}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
        >
          <FiSettings className="w-4 h-4" />
          {strings.settingsButton}
        </button>
      </div>

      <dl className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="flex items-start gap-2">
          <FiHash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <dt className="text-slate-500">{strings.codeLabel}</dt>
            <dd className="font-medium text-slate-900">{project.code || strings.emptyValue}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FiMapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <dt className="text-slate-500">{strings.locationLabel}</dt>
            <dd className="font-medium text-slate-900">{project.location || strings.emptyValue}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FiCalendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <dt className="text-slate-500">{strings.startLabel}</dt>
            <dd className="font-medium text-slate-900">{fmt(project.start_date)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FiCalendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <dt className="text-slate-500">{strings.endLabel}</dt>
            <dd className="font-medium text-slate-900">{fmt(project.end_date)}</dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
