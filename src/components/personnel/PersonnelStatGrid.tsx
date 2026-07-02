import type { ReactNode } from 'react';

export type StatItem = {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  iconWrap?: string;
};

export function PersonnelStatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 sm:p-5"
        >
          <div
            className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-40 pointer-events-none ${item.accent}`}
          />
          <div
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.iconWrap ?? item.accent}`}
          >
            {item.icon}
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {item.label}
          </p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums truncate">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
