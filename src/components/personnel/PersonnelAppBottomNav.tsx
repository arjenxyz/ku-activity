'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { NavIconHome, NavIconQr } from '@/components/personnel/PersonnelNavIcons';
import { PersonnelNavHub } from '@/components/personnel/PersonnelNavHub';
import { PERSONNEL_HUB_TABS } from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

function NavIconPanel({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function NavInner() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = isValidTab(tabParam) ? tabParam : 'overview';
  const [hubOpen, setHubOpen] = useState(false);

  const isHome = pathname === '/personnel-panel' && tab === 'overview';
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');
  const isPanelSection =
    isYoklama || (pathname === '/personnel-panel' && PERSONNEL_HUB_TABS.includes(tab));

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-50 sm:hidden pointer-events-none"
        aria-label="Personel navigasyon"
      >
        <div className="mx-auto max-w-lg px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-auto">
          {/* Marka dock — selamlama kartı ile aynı dil */}
          <div className="relative overflow-hidden rounded-[1.25rem] shadow-xl shadow-blue-950/30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-950" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative flex items-stretch h-[4.25rem]">
              {/* Özet */}
              <Link
                href="/personnel-panel"
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 touch-target transition-colors ${
                  isHome ? 'text-white' : 'text-blue-200/70 hover:text-white'
                }`}
                aria-current={isHome ? 'page' : undefined}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    isHome ? 'bg-white/20 text-white' : 'text-blue-100'
                  }`}
                >
                  <NavIconHome />
                </span>
                <span className="text-[10px] font-semibold">Özet</span>
                {isHome && (
                  <span className="absolute bottom-2 h-0.5 w-5 rounded-full bg-white/90" />
                )}
              </Link>

              {/* QR — orta aksiyon */}
              <Link
                href="/personnel-panel/yoklama"
                className="relative flex flex-col items-center justify-end flex-1 -mt-7 touch-target"
                aria-current={isYoklama ? 'page' : undefined}
              >
                <span
                  className={`flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-2xl border-4 border-slate-100 dark:border-slate-900 transition-all active:scale-95 ${
                    isYoklama
                      ? 'bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                      : 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl shadow-emerald-600/40'
                  }`}
                >
                  <NavIconQr className="w-7 h-7" />
                </span>
                <span
                  className={`mt-1.5 text-[10px] font-bold pb-1 ${
                    isYoklama ? 'text-emerald-300' : 'text-blue-100'
                  }`}
                >
                  Yoklama
                </span>
              </Link>

              {/* Panel hub */}
              <button
                type="button"
                onClick={() => setHubOpen(true)}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 touch-target transition-colors ${
                  isPanelSection && !isYoklama ? 'text-white' : 'text-blue-200/70 hover:text-white'
                }`}
                aria-expanded={hubOpen}
                aria-haspopup="dialog"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    isPanelSection && !isYoklama
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100'
                  }`}
                >
                  <NavIconPanel />
                </span>
                <span className="text-[10px] font-semibold">Panel</span>
                {isPanelSection && !isYoklama && (
                  <span className="absolute bottom-2 h-0.5 w-5 rounded-full bg-white/90" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <PersonnelNavHub open={hubOpen} onClose={() => setHubOpen(false)} />

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
