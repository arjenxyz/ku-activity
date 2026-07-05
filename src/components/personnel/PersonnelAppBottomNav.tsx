'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
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
  Icon: typeof NavIconHome;
  isCenter?: boolean;
};

function DockSideItem({
  item,
  active,
  onClick,
  href,
  hubOpen,
}: {
  item: DockItem;
  active: boolean;
  onClick?: () => void;
  href?: string;
  hubOpen?: boolean;
}) {
  const { Icon } = item;

  const content = (
    <motion.span
      className="group flex flex-col items-center gap-1 py-0.5"
      whileTap={{ scale: 0.92 }}
      animate={active ? { y: -2 } : { y: 0 }}
      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
    >
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
          active
            ? 'bg-[#0E1548] text-white shadow-lg shadow-[#0E1548]/30'
            : 'text-slate-400 group-active:text-slate-600'
        }`}
      >
        <Icon className={`h-[1.2rem] w-[1.2rem] ${active ? 'text-white' : ''}`} />
        {active && (
          <motion.span
            layoutId="personnel-dock-active-glow"
            className="absolute -inset-1 -z-10 rounded-[1.1rem] bg-[#0E1548]/20 blur-md"
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          />
        )}
      </span>
      <span
        className={`max-w-[4.5rem] truncate text-[10px] font-semibold leading-none tracking-tight ${
          active ? 'text-[#0E1548] dark:text-blue-200' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {item.label}
      </span>
    </motion.span>
  );

  const className =
    'relative flex flex-1 flex-col items-center justify-end min-h-[56px] touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548]/40 focus-visible:ring-offset-2 rounded-2xl';

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
  const strings = useRegistryStrings('components/personnel/PersonnelAppBottomNav');
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
        className="personnel-dock fixed bottom-0 inset-x-0 z-50 sm:hidden pointer-events-none"
        aria-label={strings.navAriaLabel}
      >
        <div className="mx-auto max-w-lg px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))] pointer-events-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative overflow-visible rounded-[1.65rem] border border-slate-200/70 bg-white/92 shadow-[0_12px_40px_rgba(14,21,72,0.14),0_2px_8px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/92"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/40"
              aria-hidden
            />

            <div className="flex items-end justify-between px-1.5 pt-2 pb-1.5">
              {items.map((item) => {
                const active = isActive(item.id);

                if (item.isCenter) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href!}
                      className="relative z-10 flex flex-1 flex-col items-center -mt-6 touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 rounded-2xl"
                      aria-current={active ? 'page' : undefined}
                    >
                      <motion.span
                        whileTap={{ scale: 0.9 }}
                        animate={active ? { y: -3, scale: 1.02 } : { y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                        className={`relative flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-[1.15rem] text-white ring-[3px] ring-white dark:ring-slate-900 ${
                          active
                            ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 shadow-[0_10px_28px_rgba(16,185,129,0.45)]'
                            : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_8px_24px_rgba(20,184,166,0.35)]'
                        }`}
                      >
                        <span
                          className="pointer-events-none absolute inset-0 rounded-[1.15rem] bg-gradient-to-t from-black/10 to-white/15"
                          aria-hidden
                        />
                        <NavIconQr className="relative h-[1.3rem] w-[1.3rem]" />
                      </motion.span>
                      <span
                        className={`mt-1.5 max-w-[4.5rem] truncate text-[10px] font-bold leading-none ${
                          active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                return (
                  <DockSideItem
                    key={item.id}
                    item={item}
                    active={active}
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
