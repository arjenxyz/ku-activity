'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { usePathname } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HonorIconGlyph, HonorIconTile } from '@/components/icons/HonorIcons';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { useAdminNavSheet } from '@/hooks/useAdminNavSheet';
import { getAdminDockItems, type AdminDockItem } from '@/config/admin-mobile-nav';
import { isMenuPathActive } from '@/config/projectMenu';

type Props = {
  projectId: string;
};

function DockSideItem({ item, active }: { item: AdminDockItem; active: boolean }) {
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
  const sheetStrings = useRegistryStrings('components/dashboard/AdminProjectBottomNav');
  const navCopy = useRegistryStrings('config/admin-mobile-nav');
  const pathname = usePathname() ?? '';
  const { isSimple } = useAdminUiMode();
  const navSheet = useAdminNavSheet();

  const items = useMemo(() => {
    const dock = getAdminDockItems(projectId, isSimple ? 'simple' : 'advanced', navCopy);
    return dock.map((item) =>
      item.isMenu ? { ...item, onClick: () => navSheet?.open() } : item
    );
  }, [projectId, isSimple, navCopy, navSheet]);

  const isActive = (item: AdminDockItem) =>
    item.matchHref ? isMenuPathActive(projectId, pathname, item.matchHref) : false;

  return (
    <nav
      className="personnel-dock pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:hidden"
      aria-label={sheetStrings.navAriaLabel}
    >
      <div className="pointer-events-auto mx-auto max-w-lg px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div
          className="relative rounded-[1.35rem] border border-[#E2E8F0] bg-white shadow-[0_-2px_20px_rgba(14,21,72,0.08),0_8px_32px_rgba(14,21,72,0.12)]"
          style={{ colorScheme: 'light' }}
        >
          <div className="flex items-end justify-between gap-0.5 px-1 pb-1 pt-1.5">
            {items.map((item) => {
              const active = isActive(item);

              if (item.isCenter) {
                return (
                  <Link
                    key={item.id}
                    href={item.href!}
                    className="relative z-10 -mt-5 flex flex-1 touch-target flex-col items-center"
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
