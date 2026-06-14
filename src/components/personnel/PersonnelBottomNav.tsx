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
      <div className="flex justify-between items-stretch max-w-lg mx-auto px-0.5">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[9px] font-medium max-w-[4.5rem] ${
                isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="relative text-lg">{tab.icon}</span>
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-18px)] min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
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
