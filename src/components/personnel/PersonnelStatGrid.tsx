import type { ReactNode } from 'react';

export type StatValueLine = {
  count: number;
  label: string;
};

export type StatItem = {
  label: string;
  value?: string;
  valueLines?: StatValueLine[];
  icon: ReactNode;
  accent: string;
};

export function PersonnelStatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 sm:p-5"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.accent}`}>
            {item.icon}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
          {item.valueLines ? (
            <ul className="mt-2 space-y-1.5">
              {item.valueLines.map((line) => (
                <li
                  key={line.label}
                  className={`flex items-baseline justify-between gap-2 text-xs sm:text-sm ${
                    line.count === 0
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span>{line.label}</span>
                  <span
                    className={`tabular-nums shrink-0 ${
                      line.count === 0
                        ? 'font-normal'
                        : 'font-semibold text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {line.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 truncate">
              {item.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
