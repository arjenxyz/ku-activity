'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PersonnelAssetIcon } from '@/components/personnel/PersonnelAssetIcon';
import { PersonnelNavHub } from '@/components/personnel/PersonnelNavHub';
import { PERSONNEL_HUB_TABS } from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

type DockItemId = 'home' | 'work' | 'yoklama' | 'finance' | 'more';

type DockItem = {
  id: DockItemId;
  label: string;
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
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
  const content = (
    <motion.span
      className="flex min-w-0 flex-col items-center gap-1"
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
          active ? 'bg-[#0E1548]/[0.08]' : 'bg-transparent'
        }`}
      >
        {item.icon}
      </span>
      <span
        className={`max-w-[4.5rem] truncate text-[10px] leading-none tracking-wide ${
          active ? 'font-semibold text-[#0E1548]' : 'font-medium text-slate-400'
        }`}
      >
        {item.label}
      </span>
    </motion.span>
  );

  const className =
    'relative flex flex-1 flex-col items-center justify-end min-h-[52px] touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548]/25 rounded-xl';

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
    {
      id: 'home',
      label: strings.home,
      href: '/personnel-panel',
      icon: <PersonnelAssetIcon name="home" className="h-7 w-7" />,
    },
    {
      id: 'work',
      label: strings.work,
      href: '/personnel-panel?tab=work',
      icon: <PersonnelAssetIcon name="work" className="h-7 w-7" />,
    },
    {
      id: 'yoklama',
      label: strings.yoklama,
      href: '/personnel-panel/yoklama',
      icon: <PersonnelAssetIcon name="yoklama" className="h-8 w-8" />,
      isCenter: true,
    },
    {
      id: 'finance',
      label: strings.finance,
      href: '/personnel-panel?tab=finance',
      icon: <PersonnelAssetIcon name="finance" className="h-8 w-8" />,
    },
    {
      id: 'more',
      label: strings.more,
      onClick: () => setHubOpen(true),
      icon: <PersonnelAssetIcon name="more" className="h-7 w-7" />,
    },
  ];

  const isActive = (id: DockItemId) => {
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
        className="personnel-dock fixed bottom-0 inset-x-0 z-50 sm:hidden pointer-events-none no-print"
        aria-label={strings.navAriaLabel}
      >
        <div className="mx-auto max-w-lg px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))] pointer-events-auto">
          <div
            className="relative rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_4px_24px_rgba(14,21,72,0.08)] backdrop-blur-md"
            style={{ colorScheme: 'light' }}
          >
            <div className="flex items-end justify-between gap-0.5 px-1.5 pt-1.5 pb-1.5">
              {items.map((item) => {
                const active = isActive(item.id);

                if (item.isCenter) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href!}
                      scroll={false}
                      className="relative z-10 -mt-4 flex flex-1 flex-col items-center touch-target focus-visible:outline-none"
                      aria-current={active ? 'page' : undefined}
                    >
                      <motion.span
                        whileTap={{ scale: 0.94 }}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_6px_18px_rgba(14,21,72,0.28)] ring-[3px] ring-white ${
                          active ? 'bg-[#0E1548]' : 'bg-[#152060]'
                        }`}
                      >
                        {item.icon}
                      </motion.span>
                      <span
                        className={`mt-1 max-w-[4.5rem] truncate text-[10px] leading-none tracking-wide ${
                          active ? 'font-semibold text-[#0E1548]' : 'font-medium text-slate-500'
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
