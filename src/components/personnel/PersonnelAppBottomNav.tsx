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
import {
  PERSONNEL_DOCK_ACCENTS,
  PERSONNEL_HUB_TABS,
  PERSONNEL_NAV_TILE_ACCENTS,
  type PersonnelMoreAccent,
} from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';
import strings from '@json/src/components/personnel/PersonnelAppBottomNav.json';

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

type DockItem = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  Icon: typeof NavIconHome;
  isCenter?: boolean;
};

function DockSideItem({
  item,
  active,
  accentKey,
  onClick,
  href,
  hubOpen,
}: {
  item: DockItem;
  active: boolean;
  accentKey: PersonnelMoreAccent;
  onClick?: () => void;
  href?: string;
  hubOpen?: boolean;
}) {
  const accent = PERSONNEL_NAV_TILE_ACCENTS[accentKey];
  const { Icon } = item;

  const content = (
    <motion.span
      className="flex flex-col items-center gap-1.5 py-1"
      whileTap={{ scale: 0.94 }}
      animate={active ? { y: -1 } : { y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <motion.span
        layout
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${
          active ? `${accent.icon} shadow-md ring-2 ring-white/80 dark:ring-slate-900/80` : accent.muted
        }`}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <Icon className="h-[1.15rem] w-[1.15rem]" />
        {active && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.45, scale: 1 }}
            className={`absolute -inset-0.5 -z-10 rounded-[0.85rem] blur-sm ${accent.icon.split(' ')[0]}`}
          />
        )}
      </motion.span>
      <span
        className={`text-[10px] font-bold leading-none tracking-tight ${
          active ? accent.label : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {item.label}
      </span>
    </motion.span>
  );

  const className = 'relative flex flex-1 flex-col items-center justify-end min-h-[58px] touch-target';

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-expanded={hubOpen}
      aria-haspopup="dialog"
    >
      {content}
    </button>
  );
}

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
    { id: 'home', label: strings.home, href: '/personnel-panel', Icon: NavIconHome },
    { id: 'work', label: strings.work, href: '/personnel-panel?tab=work', Icon: NavIconWork },
    {
      id: 'yoklama',
      label: strings.yoklama,
      href: '/personnel-panel/yoklama',
      Icon: NavIconQr,
      isCenter: true,
    },
    { id: 'finance', label: strings.finance, href: '/personnel-panel?tab=finance', Icon: NavIconFinance },
    { id: 'more', label: strings.more, onClick: () => setHubOpen(true), Icon: NavIconMenu },
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
        aria-label={strings.navAriaLabel}
      >
        <div className="mx-auto max-w-lg px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-auto">
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_8px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95"
          >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent dark:via-slate-600/40" />

            <div className="flex items-end justify-between px-2 pt-2.5 pb-2">
              {items.map((item) => {
                const active = isActive(item.id);

                if (item.isCenter) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href!}
                      className="relative flex flex-1 flex-col items-center -mt-7 touch-target"
                      aria-current={active ? 'page' : undefined}
                    >
                      <motion.span
                        whileTap={{ scale: 0.92 }}
                        animate={
                          active
                            ? { scale: 1, y: -2 }
                            : { scale: [1, 1.03, 1], y: 0 }
                        }
                        transition={
                          active
                            ? { type: 'spring', stiffness: 400, damping: 22 }
                            : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                        }
                        className={`relative flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1.1rem] text-white shadow-lg ${
                          active
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600 ring-[3px] ring-emerald-100 dark:ring-emerald-900/60'
                            : 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/25'
                        }`}
                      >
                        {!active && (
                          <motion.span
                            className="absolute inset-0 rounded-[1.1rem] border-2 border-emerald-300/50"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                          />
                        )}
                        <NavIconQr className="h-[1.35rem] w-[1.35rem]" />
                      </motion.span>
                      <span
                        className={`mt-1.5 text-[10px] font-bold leading-none ${
                          active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                const accentKey = PERSONNEL_DOCK_ACCENTS[item.id] ?? 'slate';

                return (
                  <DockSideItem
                    key={item.id}
                    item={item}
                    active={active}
                    accentKey={accentKey}
                    href={item.href}
                    onClick={item.onClick}
                    hubOpen={item.id === 'more' ? hubOpen : undefined}
                  />
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
