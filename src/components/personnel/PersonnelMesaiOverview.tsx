'use client';

import { FiClock } from 'react-icons/fi';
import type { StatValueLine } from './PersonnelStatGrid';

type Props = {
  lines: StatValueLine[];
  onOpen?: () => void;
};

export function PersonnelMesaiOverview({ lines, onOpen }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-4 sm:px-5 py-3.5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center">
            <FiClock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Mesai</p>
        </div>

        <ul className="flex-1 grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700">
          {lines.map((line) => (
            <li key={line.label} className="px-2 sm:px-4 first:pl-0 last:pr-0 text-center sm:text-left">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                {line.label.replace(' mesai', '')}
              </p>
              <p
                className={`mt-0.5 text-base sm:text-lg tabular-nums ${
                  line.count === 0
                    ? 'font-normal text-gray-300 dark:text-gray-600'
                    : 'font-semibold text-gray-800 dark:text-gray-100'
                }`}
              >
                {line.count}
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
