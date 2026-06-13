'use client';

import type { ReactNode } from 'react';

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
  iconClassName = 'bg-slate-50 dark:bg-slate-900/40',
  lines,
  formatLineLabel = (label) => label,
  onOpen,
}: Props) {
  const cols = lines.length;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-4 sm:px-5 py-3.5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClassName}`}
          >
            {icon}
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        </div>

        <ul
          className={`flex-1 grid divide-x divide-gray-100 dark:divide-slate-700 ${
            cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          {lines.map((line) => (
            <li
              key={line.label}
              className="px-2 sm:px-4 first:pl-0 last:pr-0 text-center sm:text-left"
            >
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                {formatLineLabel(line.label)}
              </p>
              <p
                className={`mt-0.5 text-base sm:text-lg tabular-nums ${
                  line.count === 0 && !line.display
                    ? 'font-normal text-gray-300 dark:text-gray-600'
                    : 'font-semibold text-gray-800 dark:text-gray-100'
                }`}
              >
                {line.display ?? line.count}
              </p>
            </li>
          ))}
        </ul>

        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-center"
          >
            Detay
          </button>
        )}
      </div>
    </div>
  );
}
