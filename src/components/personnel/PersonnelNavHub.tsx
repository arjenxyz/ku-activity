'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  PERSONNEL_HUB_SECTIONS,
  PERSONNEL_NAV_TILE_ACCENTS,
  type PersonnelHubItem,
} from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';
import {
  NavIconAsgari,
  NavIconFinance,
  NavIconMesai,
  NavIconQr,
  NavIconRights,
  NavIconSettings,
  NavIconWork,
} from '@/components/personnel/PersonnelNavIcons';

type Props = {
  open: boolean;
  onClose: () => void;
  activeTab: PersonnelTabId;
  isYoklama: boolean;
};

function hubItemIcon(item: PersonnelHubItem) {
  switch (item.id) {
    case 'work':
      return NavIconWork;
    case 'mesai':
      return NavIconMesai;
    case 'yoklama':
      return NavIconQr;
    case 'finance':
      return NavIconFinance;
    case 'asgari':
      return NavIconAsgari;
    case 'rights':
      return NavIconRights;
    case 'settings':
      return NavIconSettings;
    default:
      return NavIconWork;
  }
}

function isItemActive(item: PersonnelHubItem, tab: PersonnelTabId, isYoklama: boolean) {
  if (item.href) return isYoklama;
  return item.tab === tab;
}

function HubInner({ open, onClose, activeTab, isYoklama }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const navigate = (item: PersonnelHubItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.tab) {
      router.push(`/personnel-panel?tab=${item.tab}`, { scroll: false });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] sm:hidden" role="dialog" aria-modal="true" aria-label="CrewLedger panel">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        aria-label="Kapat"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[min(82vh,36rem)] flex flex-col overflow-hidden rounded-t-[1.75rem] shadow-2xl safe-pb animate-[personnelSheetUp_0.3s_ease-out]">
        <div className="relative shrink-0 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950" />
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative px-5 pt-3 pb-5">
            <div className="flex justify-center mb-3">
              <span className="h-1 w-10 rounded-full bg-white/30" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <BrandMark size="sm" className="ring-2 ring-white/25" />
                <div>
                  <p className="text-xs font-bold tracking-[0.12em] text-blue-100">CREWLEDGER</p>
                  <h2 className="text-lg font-bold text-white">Panel</h2>
                  <p className="text-xs text-blue-100/80 mt-0.5">Tüm bölümlere buradan gidin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
                aria-label="Kapat"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 space-y-5">
          {PERSONNEL_HUB_SECTIONS.map((section) => (
            <section key={section.title}>
              <div className="mb-2.5 px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {section.title}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{section.subtitle}</p>
              </div>
              <ul className={`grid gap-2 ${section.items.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {section.items.map((item) => {
                  const Icon = hubItemIcon(item);
                  const active = isItemActive(item, activeTab, isYoklama);
                  const accent = PERSONNEL_NAV_TILE_ACCENTS[item.accent];
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigate(item)}
                        className={`relative w-full flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b p-3.5 text-center transition-all active:scale-[0.97] ${
                          accent.tile
                        } ${
                          active
                            ? `ring-2 ring-blue-500/50 shadow-lg ${accent.glow}`
                            : 'shadow-sm hover:shadow-md'
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-md ${accent.icon}`}
                        >
                          <Icon />
                        </span>
                        <span>
                          <span className="block text-xs font-bold text-slate-900 dark:text-white">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {item.description}
                          </span>
                        </span>
                        {active && (
                          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

export function PersonnelNavHub(props: Omit<Props, 'activeTab' | 'isYoklama'>) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = isValidTab(tabParam) ? tabParam : 'overview';
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');

  return (
    <Suspense fallback={null}>
      <HubInner {...props} activeTab={tab} isYoklama={isYoklama} />
    </Suspense>
  );
}
