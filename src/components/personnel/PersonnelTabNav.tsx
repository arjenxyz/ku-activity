'use client';

import type { ReactNode } from 'react';

export type TabItem = {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

export function PersonnelTabNav({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-5 sm:mb-6 -mx-3 sm:mx-0">
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto px-3 sm:px-2 pb-1 scrollbar-hide snap-x snap-mandatory sm:rounded-2xl sm:border sm:border-slate-200/80 sm:bg-white/75 sm:py-2 sm:shadow-sm dark:sm:border-slate-700 dark:sm:bg-slate-900/55">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`snap-start shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/15'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="ml-0.5 min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
