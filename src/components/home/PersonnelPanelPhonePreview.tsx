'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  PersonnelAssetIcon,
  type PersonnelIconName,
} from '@/components/personnel/PersonnelAssetIcon';
import { PersonnelFinancePanel } from '@/components/personnel/PersonnelFinancePanel';
import { PersonnelNetHero } from '@/components/personnel/PersonnelNetHero';
import { PersonnelUnifiedCalendar } from '@/components/personnel/PersonnelUnifiedCalendar';
import { getPersonnelHubSections } from '@/config/personnel-mobile-nav';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import {
  DEMO_EMPLOYEE,
  getDemoAbsenceDates,
  getDemoDeductions,
  getDemoMinimumWages,
  getDemoMonthStats,
  getDemoTodayAttendance,
  getDemoWorkLogs,
} from '@/lib/demo/personnel-demo-data';
import { buildUnifiedCalendar, currentMonth } from '@/lib/personnel-stats';
import { formatString } from '@/lib/strings/format';
import { formatWorkLogSummary } from '@/lib/work-log';

const PREVIEW_WIDTH = 390;
const PREVIEW_HEIGHT = 780;
const TAB_ORDER = ['home', 'work', 'yoklama', 'finance', 'more'] as const;
const AUTOPLAY_MS = 3800;

type PreviewTab = (typeof TAB_ORDER)[number];

const HUB_ICON_NAME: Record<string, PersonnelIconName> = {
  work: 'work',
  yoklama: 'yoklama',
  finance: 'finance',
  avans: 'avans',
  settings: 'settings',
};

function PreviewTopBar({ immersive }: { immersive?: boolean }) {
  const headerStrings = useRegistryStrings('components/home/HomeHeader');
  const yoklamaStrings = useRegistryStrings('app/personnel-panel/yoklama/page');

  return (
    <header className="px-3 pb-2 pt-2">
      <div
        className={`flex h-14 items-center justify-between gap-3 rounded-2xl border px-3 ${
          immersive
            ? 'border-white/15 bg-black/60 shadow-lg shadow-black/30'
            : 'border-slate-200 bg-white shadow-sm'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <BrandMark
            size="sm"
            className={`shrink-0 ${
              immersive ? 'ring-2 ring-white/20 shadow-lg' : 'ring-2 ring-[#0E1548]/10 shadow-md'
            }`}
          />
          <div className="min-w-0">
            <p
              className={`truncate text-[13px] font-bold leading-tight tracking-[0.08em] ${
                immersive ? 'text-white' : 'text-[#0E1548]'
              }`}
            >
              CREWLEDGER
            </p>
            <p
              className={`truncate text-[10px] font-medium leading-tight ${
                immersive ? 'text-white/55' : 'text-slate-500'
              }`}
            >
              {immersive ? yoklamaStrings.exitHint : headerStrings.tagline}
            </p>
          </div>
        </div>
        {immersive ? (
          <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-semibold text-white">
            {yoklamaStrings.enterCodeButton}
          </span>
        ) : (
          <div className="shrink-0 rounded-xl bg-slate-100/80 p-0.5">
            <span className="flex h-10 w-10 items-center justify-center">
              <PersonnelAssetIcon name="bell" className="h-7 w-7" />
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

function PreviewAttendanceCard() {
  const strings = useRegistryStrings('components/personnel/PersonnelTodayAttendance');
  const today = getDemoTodayAttendance();
  const formatTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : '—');

  return (
    <section
      aria-hidden
      className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-white shadow-sm"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{strings.badge}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{today.project.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatString(strings.shiftHours, {
                start: formatTime(today.project.workStartTime),
                end: today.project.workEndTime
                  ? formatString(strings.shiftEnd, { end: formatTime(today.project.workEndTime) })
                  : '',
              })}
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <FiCheckCircle className="h-5 w-5" aria-hidden />
          </span>
        </div>
        <p className="mt-3 text-base font-semibold text-slate-900">{strings.confirmed}</p>
        {today.workLog ? (
          <p className="mt-1 text-sm text-slate-600">
            {formatWorkLogSummary(today.workLog.amount, today.workLog.mesai_type)}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PreviewOverviewScreen({
  month,
  demoStats,
}: {
  month: string;
  demoStats: ReturnType<typeof getDemoMonthStats>;
}) {
  return (
    <div className="space-y-3">
      <PersonnelNetHero
        fullName={DEMO_EMPLOYEE.name}
        position={DEMO_EMPLOYEE.position}
        photoUrl={DEMO_EMPLOYEE.photo_url}
        net={demoStats.net_pay}
        gross={demoStats.gross_pay}
        totalAdvance={demoStats.total_advances}
        totalDeduct={demoStats.total_deductions}
        month={month}
        onMonthChange={() => {}}
        onOpenFinance={() => {}}
        forceMobile
      />
      <PreviewAttendanceCard />
    </div>
  );
}

function PreviewWorkScreen({ month }: { month: string }) {
  const workLogs = useMemo(() => getDemoWorkLogs(month), [month]);
  const deductions = useMemo(() => getDemoDeductions(month), [month]);
  const minimumWages = useMemo(() => getDemoMinimumWages(), []);
  const absenceDates = useMemo(() => getDemoAbsenceDates(month), [month]);
  const days = useMemo(
    () =>
      buildUnifiedCalendar(month, workLogs, deductions, minimumWages, DEMO_EMPLOYEE.daily_wage, {
        hireDate: DEMO_EMPLOYEE.hire_date,
        absenceDates,
      }),
    [month, workLogs, deductions, minimumWages, absenceDates]
  );

  return (
    <div className="min-h-0 overflow-hidden rounded-2xl">
      <div className="origin-top scale-[0.92]">
        <PersonnelUnifiedCalendar month={month} onMonthChange={() => {}} days={days} />
      </div>
    </div>
  );
}

function PreviewYoklamaScreen() {
  const strings = useRegistryStrings('components/personnel/PersonnelTodayAttendance');
  const scannerStrings = useRegistryStrings('components/personnel/AttendanceQrScanner');
  const statusStrings = useRegistryStrings('components/personnel/AttendanceStatusSticker');
  const yoklamaStrings = useRegistryStrings('app/personnel-panel/yoklama/page');
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<'scanning' | 'success'>('scanning');

  useEffect(() => {
    setPhase('scanning');
    const delay = reduceMotion ? 400 : 1400;
    const timer = window.setTimeout(() => setPhase('success'), delay);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(96,165,250,0.35), transparent 45%), radial-gradient(circle at 70% 70%, rgba(16,185,129,0.2), transparent 40%), linear-gradient(160deg, #0f172a, #020617)',
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        {phase === 'scanning' ? (
          <motion.div
            key="scanning"
            className="absolute inset-0 z-[2]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28 }}
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="relative h-[min(58vw,200px)] w-[min(58vw,200px)] rounded-2xl border-2 border-emerald-400/80"
                style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}
              >
                <motion.div
                  className="absolute inset-x-3 top-3 h-0.5 rounded-full bg-emerald-300/90 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                  animate={reduceMotion ? undefined : { top: ['12%', '82%', '12%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent px-4 pb-5 pt-10 text-center">
              <p className="text-sm font-semibold text-white">{strings.scanQr}</p>
              <p className="text-xs text-white/70">{scannerStrings.openingCamera}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            className="absolute inset-0 z-[3] flex flex-col items-center justify-center px-5 text-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            role="status"
          >
            <div className="absolute inset-0 bg-black/55" aria-hidden />
            <div className="absolute inset-0 bg-emerald-400/15 blur-3xl" aria-hidden />

            <div className="relative z-10 flex flex-col items-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {statusStrings.states.waiting.pill}
              </span>

              <div className="relative mt-7 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-2xl" aria-hidden />
                <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-400/30">
                  <FiCheckCircle className="h-10 w-10 text-emerald-400" strokeWidth={2} />
                </div>
              </div>

              <h2 className="mt-5 text-xl font-bold leading-tight tracking-tight text-white">
                {statusStrings.states.waiting.title}
              </h2>
              <p className="mt-2.5 max-w-[15rem] text-sm leading-relaxed text-white/65">
                {statusStrings.states.waiting.hint}
              </p>
              <p className="mt-4 text-xs font-medium text-emerald-300/90">{yoklamaStrings.scanSuccess}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewFinanceScreen({ demoStats }: { demoStats: ReturnType<typeof getDemoMonthStats> }) {
  return (
    <div className="min-h-0 overflow-hidden">
      <PersonnelFinancePanel
        stats={{
          gross: demoStats.gross_pay,
          basePay: demoStats.base_pay,
          mesaiPay: demoStats.mesai_pay,
          totalAdvance: demoStats.total_advances,
          totalDeduct: demoStats.total_deductions,
          totalMinimum: demoStats.total_minimum,
          net: demoStats.net_pay,
        }}
      />
    </div>
  );
}

function PreviewMoreScreen() {
  const { locale } = useLocale();
  const hubStrings = useRegistryStrings('components/personnel/PersonnelNavHub');
  const hubSections = getPersonnelHubSections(locale);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl">
      <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-3">
        <div className="mb-3 flex justify-center">
          <span className="h-1 w-12 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size="sm" />
            <div>
              <p className="text-xs font-bold tracking-wide text-blue-600">{hubStrings.brand}</p>
              <h2 className="text-lg font-bold text-slate-900">{hubStrings.title}</h2>
            </div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FiX className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="space-y-5 overflow-hidden p-4">
        {hubSections.map((section) => (
          <section key={section.title}>
            <div className="mb-2.5 px-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{section.title}</h3>
              <p className="text-[11px] text-slate-400">{section.subtitle}</p>
            </div>
            <ul className={`grid gap-2.5 ${section.items.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {section.items.map((item) => (
                <li key={item.id}>
                  <div className="relative flex w-full flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-sm">
                    <span className="inline-flex h-12 w-12 items-center justify-center">
                      <PersonnelAssetIcon
                        name={HUB_ICON_NAME[item.id] ?? 'settings'}
                        className={
                          item.id === 'finance' ? 'h-12 w-12 scale-[1.35]' : 'h-11 w-11'
                        }
                      />
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function PreviewBottomNav({ activeTab }: { activeTab: PreviewTab }) {
  const strings = useRegistryStrings('components/personnel/PersonnelAppBottomNav');
  const items = [
    { id: 'home' as const, label: strings.home, icon: 'home' as const, center: false },
    { id: 'work' as const, label: strings.work, icon: 'work' as const, center: false },
    { id: 'yoklama' as const, label: strings.yoklama, icon: 'yoklama' as const, center: true },
    { id: 'finance' as const, label: strings.finance, icon: 'finance' as const, center: false },
    { id: 'more' as const, label: strings.more, icon: 'more' as const, center: false },
  ];

  return (
    <nav aria-hidden className="px-3 pb-3 pt-1">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 px-1.5 pb-1.5 pt-1.5 shadow-[0_4px_24px_rgba(14,21,72,0.08)] backdrop-blur-md">
        <div className="flex items-end justify-between gap-0.5">
          {items.map((item) => {
            const active = activeTab === item.id;

            if (item.center) {
              return (
                <div key={item.id} className="relative flex flex-1 flex-col items-center">
                  <motion.span
                    className="relative z-10 -mt-3 flex h-12 w-12 items-center justify-center"
                    animate={{ scale: active ? 1.06 : 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  >
                    <PersonnelAssetIcon name={item.icon} className="h-11 w-11" />
                  </motion.span>
                  <span
                    className={`mt-1 max-w-[4.5rem] truncate text-[10px] leading-none tracking-wide ${
                      active ? 'font-semibold text-[#0E1548]' : 'font-medium text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <div key={item.id} className="flex min-h-[52px] flex-1 flex-col items-center justify-end gap-0.5">
                <motion.span
                  className={`flex h-9 w-9 items-center justify-center ${active ? 'opacity-100' : 'opacity-90'}`}
                  animate={{ scale: active ? 1.05 : 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <PersonnelAssetIcon
                    name={item.icon}
                    className={item.icon === 'finance' ? 'h-9 w-9 scale-[1.35]' : 'h-8 w-8'}
                  />
                </motion.span>
                <span
                  className={`max-w-[4.5rem] truncate text-[10px] leading-none tracking-wide ${
                    active ? 'font-semibold text-[#0E1548]' : 'font-medium text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function PreviewScreenContent({
  tab,
  month,
  demoStats,
}: {
  tab: PreviewTab;
  month: string;
  demoStats: ReturnType<typeof getDemoMonthStats>;
}) {
  if (tab === 'home') return <PreviewOverviewScreen month={month} demoStats={demoStats} />;
  if (tab === 'work') return <PreviewWorkScreen month={month} />;
  if (tab === 'yoklama') return <PreviewYoklamaScreen />;
  if (tab === 'finance') return <PreviewFinanceScreen demoStats={demoStats} />;
  return <PreviewMoreScreen />;
}

export function PersonnelPanelPhonePreview({
  onImmersiveChange,
}: {
  onImmersiveChange?: (immersive: boolean) => void;
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState<PreviewTab>('home');
  const [isVisible, setIsVisible] = useState(false);
  const month = useMemo(() => currentMonth(), []);
  const demoStats = useMemo(() => getDemoMonthStats(month), [month]);
  const reduceMotionPref = reduceMotion ?? false;
  const immersive = activeTab === 'yoklama';

  useEffect(() => {
    onImmersiveChange?.(immersive);
  }, [immersive, onImmersiveChange]);

  useEffect(() => {
    return () => onImmersiveChange?.(false);
  }, [onImmersiveChange]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateScale = () => {
      const width = element.clientWidth;
      if (width > 0) setScale(width / PREVIEW_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.35 }
    );
    visibilityObserver.observe(element);
    return () => visibilityObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return undefined;

    const intervalMs = reduceMotionPref ? AUTOPLAY_MS + 1200 : AUTOPLAY_MS;
    const timer = window.setInterval(() => {
      setActiveTab((current) => {
        const index = TAB_ORDER.indexOf(current);
        return TAB_ORDER[(index + 1) % TAB_ORDER.length];
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isVisible, reduceMotionPref]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${immersive ? 'bg-black' : 'bg-slate-50'}`}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          transform: `scale(${scale})`,
        }}
        aria-hidden
      >
        <div className={`flex h-full flex-col ${immersive ? 'bg-black' : 'bg-slate-50'}`}>
          <PreviewTopBar immersive={immersive} />

          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
              activeTab === 'more' || immersive ? 'px-0 pb-0' : 'px-3 pb-2'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                initial={reduceMotionPref ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
                animate={reduceMotionPref ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotionPref ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
                transition={
                  reduceMotionPref
                    ? { duration: 0.25 }
                    : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <PreviewScreenContent tab={activeTab} month={month} demoStats={demoStats} />
              </motion.div>
            </AnimatePresence>
          </div>

          {activeTab !== 'more' ? <PreviewBottomNav activeTab={activeTab} /> : null}
        </div>
      </div>
    </div>
  );
}
