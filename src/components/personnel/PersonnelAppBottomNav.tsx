'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FiBriefcase, FiDollarSign, FiHome, FiMaximize2 } from 'react-icons/fi';

function NavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const items = [
    {
      id: 'home',
      label: 'Panel',
      href: '/personnel-panel',
      icon: FiHome,
      active: pathname === '/personnel-panel' && (!tab || tab === 'overview'),
    },
    {
      id: 'yoklama',
      label: 'Yoklama',
      href: '/personnel-panel/yoklama',
      icon: FiMaximize2,
      prominent: true,
      active: pathname.startsWith('/personnel-panel/yoklama'),
    },
    {
      id: 'work',
      label: 'Yevmiye',
      href: '/personnel-panel?tab=work',
      icon: FiBriefcase,
      active: pathname === '/personnel-panel' && tab === 'work',
    },
    {
      id: 'finance',
      label: 'Finans',
      href: '/personnel-panel?tab=finance',
      icon: FiDollarSign,
      active: pathname === '/personnel-panel' && tab === 'finance',
    },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 sm:hidden border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg safe-pb"
      aria-label="Personel mobil menü"
    >
      <div className="flex items-end max-w-lg mx-auto px-1">
        {items.map((item) => {
          const Icon = item.icon;

          if ('prominent' in item && item.prominent) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col items-center flex-1 -mt-3 pb-1 touch-target"
              >
                <span
                  className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg transition-colors ${
                    item.active
                      ? 'bg-blue-600 text-white shadow-blue-500/40 ring-2 ring-blue-300'
                      : 'bg-blue-600 text-white shadow-blue-500/30 active:bg-blue-700'
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={2.25} />
                </span>
                <span
                  className={`mt-1 text-[10px] font-semibold ${item.active ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[52px] flex-1 text-[10px] font-medium touch-target ${
                item.active ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PersonnelAppBottomNav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  );
}
