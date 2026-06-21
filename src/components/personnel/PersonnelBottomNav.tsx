'use client';

import type { ReactNode } from 'react';

export type BottomNavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

export function PersonnelBottomNav({
  tabs,
  active,
  onChange,
}: {
  tabs: BottomNavItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg safe-pb">
      <div className="flex overflow-x-auto scrollbar-none max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] min-w-[4.25rem] flex-1 shrink-0 text-[10px] font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="relative text-[1.15rem] leading-none">{tab.icon}</span>
              <span className="truncate max-w-[4rem]">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute top-1 right-2 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
