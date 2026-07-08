'use client';

import strings from '@json/src/app/admin-panel/proje/ProjectFilters.json';
import { FiSearch, FiX } from 'react-icons/fi';
import type { ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';

export type ProjectFilter = 'all' | ProjectStatus;

const FILTERS: ProjectFilter[] = ['all', 'active', 'planned', 'paused', 'completed', 'archived'];

const activeChipTone: Record<ProjectFilter, string> = {
  all: 'bg-[#0E1548] text-white',
  active: 'bg-emerald-600 text-white',
  planned: 'bg-amber-500 text-white',
  paused: 'bg-slate-500 text-white',
  completed: 'bg-blue-600 text-white',
  archived: 'bg-slate-700 text-white',
};

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
  const chipLabel = (f: ProjectFilter) => (f === 'all' ? strings.allProjects : PROJECT_STATUS_LABELS[f]);

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04] sm:p-4">
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          id="search"
          className="block w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0E1548]/30"
          placeholder={strings.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={strings.searchLabel}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={strings.clearSearch}
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? `${activeChipTone[f]} shadow-sm`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chipLabel(f)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
