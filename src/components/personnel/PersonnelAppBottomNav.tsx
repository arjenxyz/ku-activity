'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { FiChevronRight, FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  PERSONNEL_MORE_ITEMS,
  PERSONNEL_NAV_ACCENTS,
  type PersonnelMoreAccent,
} from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';
import {
  NavIconAsgari,
  NavIconFinance,
  NavIconHome,
  NavIconMenu,
  NavIconMesai,
  NavIconQr,
  NavIconRights,
  NavIconSettings,
  NavIconWork,
} from '@/components/personnel/PersonnelNavIcons';

const MORE_TABS: PersonnelTabId[] = ['mesai', 'asgari', 'rights', 'settings'];

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

function moreIcon(tab: (typeof PERSONNEL_MORE_ITEMS)[number]['tab']) {
  switch (tab) {
    case 'mesai':
      return NavIconMesai;
    case 'asgari':
      return NavIconAsgari;
    case 'rights':
      return NavIconRights;
    case 'settings':
      return NavIconSettings;
  }
}

type NavItemProps = {
  href?: string;
  onClick?: () => void;
  active: boolean;
  label: string;
  accent: keyof typeof PERSONNEL_NAV_ACCENTS;
  icon: ReactNode;
  className?: string;
};

function NavItem({ href, onClick, active, label, accent, icon, className = '' }: NavItemProps) {
  const styles = PERSONNEL_NAV_ACCENTS[accent];
  const inner = (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
          active ? styles.active : styles.idle
        }`}
      >
        {icon}
      </span>
      <span
        className={`mt-1 text-[10px] font-semibold leading-none ${
          active ? styles.text : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        {label}
      </span>
    </>
  );

  const baseClass = `flex flex-1 flex-col items-center justify-center py-1.5 min-h-[56px] touch-target transition-transform active:scale-95 ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClass} aria-current={active ? 'page' : undefined}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {inner}
    </button>
  );
}

function NavInner() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = isValidTab(tabParam) ? tabParam : 'overview';
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname, tabParam]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const isHome = pathname === '/personnel-panel' && tab === 'overview';
  const isWork = pathname === '/personnel-panel' && tab === 'work';
  const isFinance = pathname === '/personnel-panel' && tab === 'finance';
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');
  const isMore = pathname === '/personnel-panel' && MORE_TABS.includes(tab);

  const goTab = (id: PersonnelTabId) => {
    router.push(`/personnel-panel?tab=${id}`, { scroll: false });
    setMoreOpen(false);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-50 sm:hidden pointer-events-none"
        aria-label="Personel uygulama menüsü"
      >
        <div className="mx-auto max-w-lg px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] pointer-events-auto">
          <div className="relative rounded-[1.35rem] border border-slate-200/90 bg-white/95 px-2 pt-2 pb-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/90 dark:bg-slate-900/95">
            <div className="flex items-end justify-between gap-0.5">
              <NavItem
                href="/personnel-panel"
                active={isHome}
                label="Ana Sayfa"
                accent="home"
                icon={<NavIconHome />}
              />

              <NavItem
                href="/personnel-panel?tab=work"
                active={isWork}
                label="Yevmiye"
                accent="work"
                icon={<NavIconWork />}
              />

              <Link
                href="/personnel-panel/yoklama"
                className="flex flex-col items-center flex-1 -mt-6 touch-target"
                aria-current={isYoklama ? 'page' : undefined}
              >
                <span
                  className={`flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-2xl text-white transition-all active:scale-95 ${
                    isYoklama
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-100 dark:ring-emerald-900/50'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-600/35'
                  }`}
                >
                  <NavIconQr />
                </span>
                <span
                  className={`mt-1.5 text-[10px] font-bold ${
                    isYoklama ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Yoklama
                </span>
              </Link>

              <NavItem
                href="/personnel-panel?tab=finance"
                active={isFinance}
                label="Finans"
                accent="finance"
                icon={<NavIconFinance />}
              />

              <NavItem
                onClick={() => setMoreOpen(true)}
                active={isMore}
                label="Menü"
                accent="menu"
                icon={<NavIconMenu />}
              />
            </div>
          </div>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] sm:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Kapat"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[min(75vh,32rem)] overflow-hidden rounded-t-[1.75rem] bg-white dark:bg-slate-900 shadow-2xl safe-pb animate-[personnelSheetUp_0.28s_ease-out]">
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between px-5 pb-4 pt-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <BrandMark size="sm" />
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">Menü</p>
                  <p className="text-xs text-slate-500">Diğer bölümler</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Kapat"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <ul className="overflow-y-auto p-4 grid gap-2">
              {PERSONNEL_MORE_ITEMS.map((item) => {
                const Icon = moreIcon(item.tab);
                const active = tab === item.tab;
                const accent = PERSONNEL_NAV_ACCENTS[item.accent as PersonnelMoreAccent];
                return (
                  <li key={item.tab}>
                    <button
                      type="button"
                      onClick={() => goTab(item.tab)}
                      className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                        active
                          ? 'border-blue-200 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-950/30'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          active ? accent.active : accent.idle
                        }`}
                      >
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.description}
                        </span>
                      </span>
                      <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes personnelSheetUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
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
