'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { HonorIconGlyph, HonorIconTile, type HonorIconName, type HonorIconTheme } from '@/components/icons/HonorIcons';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { useAdminNavSheet } from '@/hooks/useAdminNavSheet';
import { isMenuPathActive } from '@/config/projectMenu';

type Props = {
  projectId: string;
};

type DockItem = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  iconName: HonorIconName;
  iconTheme: HonorIconTheme;
  isCenter?: boolean;
  matchHref?: string;
};

function DockSideItem({
  item,
  active,
}: {
  item: DockItem;
  active: boolean;
}) {
  const content = (
    <motion.span
      className="group flex min-w-0 flex-col items-center gap-1"
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
    >
      <span className="relative flex h-10 w-10 items-center justify-center">
        {active ? (
          <HonorIconTile name={item.iconName} theme={item.iconTheme} size="sm" />
        ) : (
          <HonorIconGlyph
            name={item.iconName}
            className="h-[1.35rem] w-[1.35rem] text-[#94A3B8] group-active:text-[#64748B]"
          />
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

  if (item.href) {
    return (
      <Link href={item.href} className={className} aria-current={active ? 'page' : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={className} aria-haspopup="dialog">
      {content}
    </button>
  );
}

function NavInner({ projectId }: Props) {
  const strings = useRegistryStrings('components/dashboard/AdminProjectBottomNav');
  const pathname = usePathname() ?? '';
  const { isSimple } = useAdminUiMode();
  const navSheet = useAdminNavSheet();

  const base = `/admin-panel/proje/${projectId}`;

  const secondItem: DockItem = isSimple
    ? { id: 'kesinti', label: strings.deduction, href: `${base}/kesinti`, iconName: 'minus', iconTheme: 'orange', matchHref: `${base}/kesinti` }
    : { id: 'personnel', label: strings.personnel, href: `${base}/list`, iconName: 'users', iconTheme: 'emerald', matchHref: `${base}/list` };

  const items: DockItem[] = [
    { id: 'summary', label: strings.summary, href: base, iconName: 'home', iconTheme: 'blue', matchHref: base },
    secondItem,
    { id: 'attendance', label: strings.attendance, href: `${base}/yevmiye`, iconName: 'calendar', iconTheme: 'teal', isCenter: true, matchHref: `${base}/yevmiye` },
    { id: 'advance', label: strings.advance, href: `${base}/avans`, iconName: 'wallet', iconTheme: 'indigo', matchHref: `${base}/avans` },
    { id: 'menu', label: strings.menu, onClick: () => navSheet?.open(), iconName: 'menu', iconTheme: 'slate' },
  ];

  const isActive = (item: DockItem) =>
    item.matchHref ? isMenuPathActive(projectId, pathname, item.matchHref) : false;

  return (
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
              const active = isActive(item);

              if (item.isCenter) {
                return (
                  <Link
                    key={item.id}
                    href={item.href!}
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
                      <HonorIconGlyph name={item.iconName} className="relative h-[1.45rem] w-[1.45rem] text-white" />
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

              return <DockSideItem key={item.id} item={item} active={active} />;
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function AdminProjectBottomNav({ projectId }: Props) {
  return (
    <Suspense fallback={null}>
      <NavInner projectId={projectId} />
    </Suspense>
  );
}
