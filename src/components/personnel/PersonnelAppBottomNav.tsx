'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import {
  NavIconFinance,
  NavIconHome,
  NavIconMenu,
  NavIconQr,
  NavIconWork,
} from '@/components/personnel/PersonnelNavIcons';
import { PersonnelNavHub } from '@/components/personnel/PersonnelNavHub';
import { PERSONNEL_HUB_TABS } from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

type DockItem = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  isCenter?: boolean;
};

function NavInner() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = isValidTab(tabParam) ? tabParam : 'overview';
  const [hubOpen, setHubOpen] = useState(false);

  const isHome = pathname === '/personnel-panel' && tab === 'overview';
  const isWork = pathname === '/personnel-panel' && tab === 'work';
  const isFinance = pathname === '/personnel-panel' && tab === 'finance';
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');
  const isMore =
    hubOpen || (pathname === '/personnel-panel' && PERSONNEL_HUB_TABS.includes(tab));

  const items: DockItem[] = [
    {
      id: 'home',
      label: 'Özet',
      href: '/personnel-panel',
      icon: <NavIconHome className="w-[1.35rem] h-[1.35rem]" />,
    },
    {
      id: 'work',
      label: 'Yevmiye',
      href: '/personnel-panel?tab=work',
      icon: <NavIconWork className="w-[1.35rem] h-[1.35rem]" />,
    },
    {
      id: 'yoklama',
      label: 'Yoklama',
      href: '/personnel-panel/yoklama',
      icon: <NavIconQr className="w-6 h-6" />,
      isCenter: true,
    },
    {
      id: 'finance',
      label: 'Finans',
      href: '/personnel-panel?tab=finance',
      icon: <NavIconFinance className="w-[1.35rem] h-[1.35rem]" />,
    },
    {
      id: 'more',
      label: 'Menü',
      onClick: () => setHubOpen(true),
      icon: <NavIconMenu className="w-[1.35rem] h-[1.35rem]" />,
    },
  ];

  const isActive = (id: string) => {
    switch (id) {
      case 'home':
        return isHome;
      case 'work':
        return isWork;
      case 'yoklama':
        return isYoklama;
      case 'finance':
        return isFinance;
      case 'more':
        return isMore && !isYoklama;
      default:
        return false;
    }
  };

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-50 sm:hidden pointer-events-none"
        aria-label="Personel navigasyon"
      >
        <div className="mx-auto max-w-lg px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pointer-events-auto">
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative rounded-[1.65rem] border border-white/70 bg-white/85 shadow-[0_12px_48px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/90"
          >
            {/* Yumuşak üst parıltı */}
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

            <div className="flex items-end justify-between px-1.5 pt-2 pb-1.5">
              {items.map((item) => {
                const active = isActive(item.id);

                if (item.isCenter) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href!}
                      className="relative flex flex-1 flex-col items-center -mt-8 touch-target"
                      aria-current={active ? 'page' : undefined}
                    >
                      <motion.span
                        animate={
                          active
                            ? { scale: 1, boxShadow: '0 12px 28px rgba(16,185,129,0.45)' }
                            : { scale: [1, 1.04, 1], boxShadow: '0 10px 24px rgba(16,185,129,0.35)' }
                        }
                        transition={
                          active
                            ? { type: 'spring', stiffness: 400, damping: 22 }
                            : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                        }
                        className={`relative flex h-[3.6rem] w-[3.6rem] items-center justify-center rounded-[1.15rem] text-white ${
                          active
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-4 ring-emerald-100 dark:ring-emerald-900/50'
                            : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                        }`}
                      >
                        {!active && (
                          <motion.span
                            className="absolute inset-0 rounded-[1.15rem] border-2 border-emerald-300/60"
                            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                          />
                        )}
                        {item.icon}
                      </motion.span>
                      <motion.span
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-1.5 text-[10px] font-bold ${
                          active ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  );
                }

                const inner = (
                  <>
                    <motion.span
                      layout
                      className="relative flex h-9 w-9 items-center justify-center"
                    >
                      {active && (
                        <motion.span
                          layoutId="personnel-dock-pill"
                          className="absolute inset-0 rounded-xl bg-blue-600 shadow-md shadow-blue-600/30"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        />
                      )}
                      <span
                        className={`relative z-10 transition-colors duration-200 ${
                          active ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                    </motion.span>
                    <motion.span
                      animate={{
                        color: active ? '#2563eb' : undefined,
                        fontWeight: active ? 700 : 600,
                      }}
                      className={`mt-0.5 text-[10px] ${active ? '' : 'text-slate-500 dark:text-slate-400'}`}
                      style={active ? { color: '#2563eb' } : undefined}
                    >
                      {item.label}
                    </motion.span>
                  </>
                );

                const className =
                  'relative flex flex-1 flex-col items-center justify-center py-1 min-h-[52px] touch-target';

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={className}
                      aria-current={active ? 'page' : undefined}
                    >
                      {inner}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={className}
                    aria-expanded={hubOpen}
                    aria-haspopup="dialog"
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </nav>

      <PersonnelNavHub open={hubOpen} onClose={() => setHubOpen(false)} />
    </>
  );
}

export function PersonnelAppBottomNav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  );
}
