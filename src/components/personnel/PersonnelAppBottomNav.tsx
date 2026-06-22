'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  FiBookOpen,
  FiBriefcase,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiHome,
  FiMenu,
  FiSettings,
  FiShield,
  FiX,
} from 'react-icons/fi';
import { TbQrcode } from 'react-icons/tb';
import { PERSONNEL_MORE_ITEMS } from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';

const MORE_TABS: PersonnelTabId[] = ['mesai', 'asgari', 'rights', 'settings'];

function moreIcon(tab: (typeof PERSONNEL_MORE_ITEMS)[number]['tab']) {
  switch (tab) {
    case 'mesai':
      return FiClock;
    case 'asgari':
      return FiShield;
    case 'rights':
      return FiBookOpen;
    case 'settings':
      return FiSettings;
  }
}

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
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

  const sideLinkClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 min-h-[52px] touch-target transition-colors ${
      active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
    }`;

  const iconWrapClass = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
      active ? 'bg-blue-50 dark:bg-blue-950/50' : ''
    }`;

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-50 sm:hidden"
        aria-label="Personel uygulama menüsü"
      >
        <div className="mx-auto max-w-lg px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-1 rounded-2xl border border-slate-200/90 bg-white/95 px-1 py-1 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
            <Link href="/personnel-panel" className={sideLinkClass(isHome)}>
              <span className={iconWrapClass(isHome)}>
                <FiHome className="h-5 w-5" strokeWidth={isHome ? 2.25 : 2} />
              </span>
              <span className="text-[10px] font-semibold">Ana Sayfa</span>
            </Link>

            <Link href="/personnel-panel?tab=work" className={sideLinkClass(isWork)}>
              <span className={iconWrapClass(isWork)}>
                <FiBriefcase className="h-5 w-5" strokeWidth={isWork ? 2.25 : 2} />
              </span>
              <span className="text-[10px] font-semibold">Yevmiye</span>
            </Link>

            <Link
              href="/personnel-panel/yoklama"
              className="flex flex-col items-center flex-1 -mt-5 touch-target"
              aria-current={isYoklama ? 'page' : undefined}
            >
              <span
                className={`flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl shadow-lg transition-all ${
                  isYoklama
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/40'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 active:scale-95'
                }`}
              >
                <TbQrcode className="h-6 w-6" />
              </span>
              <span
                className={`mt-1 text-[10px] font-bold ${isYoklama ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Yoklama
              </span>
            </Link>

            <Link href="/personnel-panel?tab=finance" className={sideLinkClass(isFinance)}>
              <span className={iconWrapClass(isFinance)}>
                <FiDollarSign className="h-5 w-5" strokeWidth={isFinance ? 2.25 : 2} />
              </span>
              <span className="text-[10px] font-semibold">Finans</span>
            </Link>

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={sideLinkClass(isMore)}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
            >
              <span className={iconWrapClass(isMore)}>
                <FiMenu className="h-5 w-5" strokeWidth={isMore ? 2.25 : 2} />
              </span>
              <span className="text-[10px] font-semibold">Menü</span>
            </button>
          </div>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] sm:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            aria-label="Kapat"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[min(70vh,28rem)] overflow-hidden rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl safe-pb animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">Menü</p>
                <p className="text-xs text-slate-500">Diğer bölümler</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Kapat"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <ul className="overflow-y-auto p-3 space-y-1">
              {PERSONNEL_MORE_ITEMS.map((item) => {
                const Icon = moreIcon(item.tab);
                const active = tab === item.tab;
                return (
                  <li key={item.tab}>
                    <button
                      type="button"
                      onClick={() => goTab(item.tab)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
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
        @keyframes slideUp {
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
