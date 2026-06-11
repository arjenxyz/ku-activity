import { FiSearch } from 'react-icons/fi';
import type { ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';

export type ProjectFilter = 'all' | ProjectStatus;

export default function ProjectFilters({
  searchTerm,
  filter,
  onSearchChange,
  onFilterChange,
}: {
  searchTerm: string;
  filter: ProjectFilter;
  onSearchChange: (term: string) => void;
  onFilterChange: (filter: ProjectFilter) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-4 mb-6 border border-slate-200/80 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Proje Ara
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              className="block w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ad, kod veya konum..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
        </div>
        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Durum
          </label>
          <select
            id="filter"
            className="block w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as ProjectFilter)}
          >
            <option value="all">Tüm Projeler</option>
            {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
