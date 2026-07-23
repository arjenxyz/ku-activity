'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { Suspense, useEffect, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiSettings,
  FiShield,
  FiX,
} from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { BordroIcon } from '@/components/personnel/BordroIcon';
import {
  PERSONNEL_HUB_SECTIONS,
  type PersonnelHubItem,
} from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  open: boolean;
  onClose: () => void;
  activeTab: PersonnelTabId;
  isYoklama: boolean;
};

type HubIconTone = 'emerald' | 'teal' | 'indigo' | 'amber' | 'blue' | 'sky' | 'slate';

const TONE_CLASS: Record<HubIconTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/45 dark:text-emerald-300 dark:ring-emerald-900/60',
  teal: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-950/45 dark:text-sky-300 dark:ring-sky-900/60',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/45 dark:text-indigo-300 dark:ring-indigo-900/60',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/45 dark:text-amber-300 dark:ring-amber-900/60',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/45 dark:text-blue-300 dark:ring-blue-900/60',
  sky: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-950/45 dark:text-cyan-300 dark:ring-cyan-900/60',
  slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
};

function HubQrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="8" y="8" width="8" height="8" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

const HUB_ICON_MAP: Record<
  string,
  { Icon: ComponentType<{ className?: string }>; tone: HubIconTone }
> = {
  work: { Icon: FiCalendar, tone: 'emerald' },
  yoklama: { Icon: HubQrIcon, tone: 'teal' },
  avans: { Icon: FiDollarSign, tone: 'amber' },
  asgari: { Icon: FiShield, tone: 'blue' },
  rights: { Icon: FiFileText, tone: 'sky' },
  settings: { Icon: FiSettings, tone: 'slate' },
};

function HubIconTile({ itemId }: { itemId: string }) {
  if (itemId === 'finance') {
    return (
      <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800/80 dark:ring-slate-700">
        <BordroIcon className="h-9 w-9 object-contain" />
      </span>
    );
  }

  const def = HUB_ICON_MAP[itemId] ?? { Icon: FiSettings, tone: 'slate' as HubIconTone };
  const { Icon, tone } = def;
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${TONE_CLASS[tone]}`}
    >
      <Icon className="h-[1.35rem] w-[1.35rem] stroke-[1.75]" />
    </span>
  );
}

function isItemActive(item: PersonnelHubItem, tab: PersonnelTabId, isYoklama: boolean) {
  if (item.href?.includes('/yoklama')) return isYoklama;
  if (item.href) return false;
  return item.tab === tab;
}

const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 32 } },
  exit: { y: '100%', transition: { duration: 0.22 } },
};

const tileVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.04, type: 'spring' as const, stiffness: 400, damping: 26 },
  }),
};

function HubInner({ open, onClose, activeTab, isYoklama }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelNavHub');
  const router = useRouter();
  const pathname = usePathname() ?? '';

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const navigate = (item: PersonnelHubItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.tab) {
      router.push(`/personnel-panel?tab=${item.tab}`, { scroll: false });
    }
    onClose();
  };

  const isHrefActive = (href: string) => pathname.startsWith(href);

  let tileIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={strings.menuAriaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-label={strings.close}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="absolute inset-x-0 bottom-0 max-h-[min(80vh,34rem)] flex flex-col overflow-hidden rounded-t-[1.75rem] bg-white dark:bg-slate-900 shadow-2xl safe-pb"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="shrink-0 px-5 pt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <motion.div
                className="flex justify-center mb-3"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <span className="h-1 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              </motion.div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <BrandMark size="sm" />
                  <div>
                    <p className="text-xs font-bold tracking-wide text-blue-600 dark:text-blue-400">
                      {strings.brand}
                    </p>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{strings.title}</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  aria-label={strings.close}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-none p-4 space-y-5 scrollbar-thin-glass" data-allow-scroll>
              {PERSONNEL_HUB_SECTIONS.map((section, sectionIdx) => (
                <motion.section
                  key={section.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIdx * 0.06 + 0.08 }}
                >
                  <div className="mb-2.5 px-0.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {section.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">{section.subtitle}</p>
                  </div>
                  <ul
                    className={`grid gap-2.5 ${section.items.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}
                  >
                    {section.items.map((item) => {
                      const active = item.href
                        ? isHrefActive(item.href)
                        : isItemActive(item, activeTab, isYoklama);
                      const i = tileIndex++;
                      return (
                        <li key={item.id}>
                          <motion.button
                            type="button"
                            onClick={() => navigate(item)}
                            custom={i}
                            variants={tileVariants}
                            initial="hidden"
                            animate="visible"
                            whileTap={{ scale: 0.95 }}
                            className={`relative w-full flex flex-col items-center gap-2 rounded-2xl border bg-white dark:bg-slate-800 p-3.5 text-center shadow-sm ${
                              active
                                ? 'border-blue-300 ring-2 ring-blue-500/30 dark:border-blue-700'
                                : 'border-slate-200/80 dark:border-slate-700'
                            }`}
                          >
                            <motion.span whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
                              <HubIconTile itemId={item.id} />
                            </motion.span>
                            <span>
                              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                                {item.label}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">
                                {item.description}
                              </span>
                            </span>
                            {active && (
                              <motion.span
                                layoutId="hub-active-dot"
                                className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            )}
                          </motion.button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
