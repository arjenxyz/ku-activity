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
      className="group flex min-w-0 flex-col items-center gap-1"
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
    >
      <span
        className={`relative flex h-10 w-10 items-center justify-center rounded-[0.9rem] transition-colors duration-200 ${
          active ? 'bg-[#E8EBF8] text-[#0E1548]' : 'text-[#94A3B8] group-active:text-[#64748B]'
        }`}
      >
        <Icon className="h-[1.35rem] w-[1.35rem]" filled={active} />
        {active && (
          <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#0E1548]" />
        )}
      </span>
      <span
        className={`max-w-[4.25rem] truncate text-[10px] font-semibold leading-none ${
          active ? 'text-[#0E1548]' : 'text-[#94A3B8]'
        }`}
      >
        {item.label}
      </span>
    </motion.span>
  );

  const className =
    'relative flex flex-1 flex-col items-center justify-end min-h-[52px] touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548]/30 rounded-xl';

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? 'page' : undefined} scroll={false}>
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
        <div className="mx-auto max-w-lg px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-auto">
          <div
            className="relative rounded-[1.35rem] border border-[#E2E8F0] bg-white shadow-[0_-2px_20px_rgba(14,21,72,0.08),0_8px_32px_rgba(14,21,72,0.12)]"
            style={{ colorScheme: 'light' }}
          >
            <div className="flex items-end justify-between gap-0.5 px-1 pt-1.5 pb-1">
              {items.map((item) => {
                const active = isActive(item.id);

                if (item.isCenter) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href!}
                      scroll={false}
                      className="relative z-10 -mt-5 flex flex-1 flex-col items-center touch-target"
                      aria-current={active ? 'page' : undefined}
                    >
                      <motion.span
                        whileTap={{ scale: 0.9 }}
                        className={`relative flex h-[3.15rem] w-[3.15rem] items-center justify-center rounded-[1rem] text-white shadow-[0_8px_24px_rgba(14,21,72,0.35)] ring-[3px] ring-white ${
                          active ? 'bg-[#0E1548]' : 'bg-gradient-to-b from-[#152060] to-[#0E1548]'
                        }`}
                      >
                        <span
                          className="pointer-events-none absolute inset-x-2 top-1 h-4 rounded-full bg-white/15 blur-[2px]"
                          aria-hidden
                        />
                        <NavIconQr className="relative h-[1.45rem] w-[1.45rem]" filled />
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400"
                          aria-hidden
                        />
                      </motion.span>
                      <span
                        className={`mt-1 max-w-[4.25rem] truncate text-[10px] font-bold leading-none ${
                          active ? 'text-[#0E1548]' : 'text-[#64748B]'
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
          </div>
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
