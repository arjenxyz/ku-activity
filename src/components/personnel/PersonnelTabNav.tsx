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
    <div className="mb-6 -mx-4 sm:mx-0">
      <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-1 scrollbar-hide snap-x snap-mandatory">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
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
