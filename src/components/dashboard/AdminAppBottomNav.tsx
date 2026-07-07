'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { HonorIconGlyph, HonorIconTile } from '@/components/icons/HonorIcons';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

type DockItem = {
  id: string;
  label: string;
  href: string;
  iconName: 'home' | 'inbox' | 'finance' | 'settings' | 'chart';
  iconTheme: 'blue' | 'emerald' | 'indigo' | 'slate' | 'violet';
  isCenter?: boolean;
};

function DockSideItem({ item, active }: { item: DockItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="relative flex flex-1 flex-col items-center justify-end min-h-[52px] touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548]/30 rounded-xl"
      aria-current={active ? 'page' : undefined}
    >
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
    </Link>
  );
}

function NavInner() {
  const strings = useRegistryStrings('components/dashboard/AdminAppBottomNav');
  const pathname = usePathname() ?? '';

  const isProjects = pathname === '/admin-panel' || pathname.startsWith('/admin-panel/proje');
  const isApplications = pathname.startsWith('/admin-panel/basvuru-onay');
  const isPolicy = pathname.startsWith('/admin-panel/maas-politikasi');
  const isArjen = pathname.startsWith('/admin-panel/arjen');
  const isSettings = pathname.startsWith('/admin-panel/ayarlar');

  const items: DockItem[] = [
    { id: 'projects', label: strings.projects, href: '/admin-panel', iconName: 'home', iconTheme: 'blue' },
    { id: 'arjen', label: strings.arjen, href: '/admin-panel/arjen/avans', iconName: 'chart', iconTheme: 'violet' },
    {
      id: 'applications',
      label: strings.applications,
      href: '/admin-panel/basvuru-onay',
      iconName: 'inbox',
      iconTheme: 'emerald',
      isCenter: true,
    },
    { id: 'policy', label: strings.policy, href: '/admin-panel/maas-politikasi', iconName: 'finance', iconTheme: 'indigo' },
    { id: 'settings', label: strings.settings, href: '/admin-panel/ayarlar', iconName: 'settings', iconTheme: 'slate' },
  ];

  const isActive = (id: string) => {
    switch (id) {
      case 'projects':
        return isProjects && !isApplications && !isPolicy && !isArjen && !isSettings;
      case 'arjen':
        return isArjen;
      case 'applications':
        return isApplications;
      case 'policy':
        return isPolicy;
      case 'settings':
        return isSettings;
      default:
        return false;
    }
  };

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
              const active = isActive(item.id);

              if (item.isCenter) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
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
                      <HonorIconGlyph name="inbox" className="relative h-[1.45rem] w-[1.45rem] text-white" />
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

export function AdminAppBottomNav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  );
}
