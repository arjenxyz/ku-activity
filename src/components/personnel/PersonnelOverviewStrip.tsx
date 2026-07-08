'use client';

import type { ReactNode } from 'react';
import { FiChevronRight } from 'react-icons/fi';

export type OverviewLine = {
  count: number;
  label: string;
  display?: string;
};

type Props = {
  title: string;
  icon: ReactNode;
  iconClassName?: string;
  lines: OverviewLine[];
  formatLineLabel?: (label: string) => string;
  onOpen?: () => void;
};

export function PersonnelOverviewStrip({
  title,
  icon,
  iconClassName = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  lines,
  formatLineLabel = (label) => label,
  onOpen,
}: Props) {
  const cols = lines.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      className={`w-full text-left rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-4 sm:px-5 py-4 transition-all ${
        onOpen
          ? 'hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md active:scale-[0.995] cursor-pointer'
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}>
          {icon}
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white flex-1">{title}</p>
        {onOpen && <FiChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>

      <ul
        className={`grid gap-2 ${
          cols === 2
            ? 'grid-cols-2'
            : cols === 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-3'
        }`}
      >
        {lines.map((line) => (
          <li
            key={line.label}
            className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5 text-center sm:text-left"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {formatLineLabel(line.label)}
            </p>
            <p
              className={`mt-0.5 text-lg tabular-nums ${
                line.count === 0 && !line.display
                  ? 'font-medium text-slate-300 dark:text-slate-600'
                  : 'font-bold text-slate-900 dark:text-white'
              }`}
            >
              {line.display ?? line.count}
            </p>
          </li>
        ))}
      </ul>
    </button>
  );
}
