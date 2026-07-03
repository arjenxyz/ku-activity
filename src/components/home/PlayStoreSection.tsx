'use client';

import Image from 'next/image';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';
import { BrandIconRain } from '@/components/home/BrandIconRain';
import {
  PLAY_STORE_ADMIN_ICON,
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_PERSONNEL_ICON,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';

const AUTO_SWAP_MS = 4500;
const HEADER_PEEK = 108;

const apps = [
  {
    id: 'personel',
    badge: 'Personel',
    title: 'Personel Uygulaması',
    description:
      'Yoklama, yevmiye, mesai ve bordro görüntüleme. Başvuru ve günlük işlemler için tasarlandı.',
    playUrl: PLAY_STORE_PERSONNEL_URL,
    iconSrc: PLAY_STORE_PERSONNEL_ICON,
    badgeClass:
      'text-violet-700 bg-violet-100/90 border-violet-200/80 dark:text-violet-300 dark:bg-violet-950/50 dark:border-violet-800/50',
    cardClass:
      'border-violet-200 bg-[#f3f0fa] dark:border-violet-900/50 dark:bg-violet-950/30',
    peekClass: 'bg-[#ebe6f4] dark:bg-violet-950/50',
    dividerClass: 'border-violet-100/90 dark:border-violet-900/30',
    ringClass: 'ring-violet-200/60 dark:ring-violet-800/40',
    headerActiveClass: 'active:bg-violet-100/70 dark:active:bg-violet-950/40',
    iconRingClass: 'ring-violet-200/70 dark:ring-violet-800/50',
  },
  {
    id: 'admin',
    badge: 'Yönetici',
    title: 'Yönetici Uygulaması',
    description:
      'Proje yönetimi, personel onayı, yevmiye ve raporlar. Ofisten veya sahada tam kontrol.',
    playUrl: PLAY_STORE_ADMIN_URL,
    iconSrc: PLAY_STORE_ADMIN_ICON,
    badgeClass:
      'text-teal-800 bg-teal-50/95 border-teal-200/80 dark:text-teal-300 dark:bg-teal-950/45 dark:border-teal-800/50',
    cardClass:
      'border-teal-200 bg-[#f0f7f5] dark:border-teal-900/50 dark:bg-teal-950/30',
    peekClass: 'bg-[#e4f0ec] dark:bg-teal-950/50',
    dividerClass: 'border-teal-100/90 dark:border-teal-900/30',
    ringClass: 'ring-teal-200/60 dark:ring-teal-800/40',
    headerActiveClass: 'active:bg-teal-100/70 dark:active:bg-teal-950/40',
    iconRingClass: 'ring-teal-200/70 dark:ring-teal-800/50',
  },
] as const;

type App = (typeof apps)[number];

const springTransition = { type: 'spring' as const, stiffness: 260, damping: 28 };

function CardsConnector({ layout }: { layout: 'row' | 'column' }) {
  if (layout === 'column') {
    return (
      <div className="flex justify-center py-1" aria-hidden>
        <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex h-full justify-center px-2 sm:px-3" aria-hidden>
      <div className="w-px self-stretch bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-slate-700" />
    </div>
  );
}

function AppCard({
  app,
  index,
  className = '',
}: {
  app: App;
  index: number;
  className?: string;
}) {
  const hasPlayLink = Boolean(app.playUrl);

  return (
    <motion.article
      className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7 ${app.cardClass} ${className}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <AppCardHeader app={app} />
      <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{app.description}</p>
      <div className={`mt-6 border-t pt-5 ${app.dividerClass}`}>
        <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} fullWidth />
      </div>
    </motion.article>
  );
}

function AppCardHeader({
  app,
  onHeaderClick,
  compact = false,
}: {
  app: App;
  onHeaderClick?: () => void;
  compact?: boolean;
}) {
  const iconSize = compact ? 'h-11 w-11' : 'h-14 w-14';
  const titleClass = compact
    ? 'mt-1 truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white'
    : 'mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white';

  const content = (
    <>
      <div className={`${iconSize} shrink-0 overflow-hidden rounded-xl ring-1 ${app.iconRingClass}`}>
        <Image
          src={app.iconSrc}
          alt=""
          width={compact ? 44 : 56}
          height={compact ? 44 : 56}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${app.badgeClass}`}
          >
            {app.badge}
          </span>
          {!compact && <span className="text-xs text-slate-400">Android · Ücretsiz</span>}
        </div>
        <h3 className={titleClass}>{app.title}</h3>
      </div>
    </>
  );

  if (onHeaderClick) {
    return (
      <button
        type="button"
        onClick={onHeaderClick}
        className={`flex w-full items-center gap-4 rounded-xl text-left transition-colors ${app.headerActiveClass}`}
        aria-label={`${app.title} — kartları değiştir`}
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center gap-4">{content}</div>;
}

function MobileStackCard({
  app,
  isFront,
  onHeaderClick,
  cardRef,
}: {
  app: App;
  isFront: boolean;
  onHeaderClick?: () => void;
  cardRef?: RefObject<HTMLElement | null>;
}) {
  const hasPlayLink = Boolean(app.playUrl);

  return (
    <article
      ref={cardRef as RefObject<HTMLElement>}
      style={isFront ? undefined : { height: HEADER_PEEK }}
      className={`flex flex-col overflow-hidden rounded-2xl border ${
        isFront ? `p-6 shadow-lg ring-1 ${app.ringClass} ${app.cardClass}` : `p-4 shadow-sm ${app.peekClass} ${app.cardClass}`
      }`}
    >
      <AppCardHeader app={app} onHeaderClick={onHeaderClick} compact={!isFront} />
      {isFront && (
        <>
          <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{app.description}</p>
          <div
            className={`mt-6 border-t pt-5 ${app.dividerClass}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} fullWidth />
          </div>
        </>
      )}
    </article>
  );
}

function MobileStackedAppCards() {
  const [adminOnTop, setAdminOnTop] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const personelRef = useRef<HTMLElement>(null);
  const adminRef = useRef<HTMLElement>(null);
  const personelProbeRef = useRef<HTMLElement>(null);
  const adminProbeRef = useRef<HTMLElement>(null);
  const [heights, setHeights] = useState({ personel: 320, admin: 320 });

  const swap = useCallback(() => setAdminOnTop((v) => !v), []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const measure = () => {
      setHeights({
        personel: personelProbeRef.current?.offsetHeight ?? personelRef.current?.offsetHeight ?? 320,
        admin: adminProbeRef.current?.offsetHeight ?? adminRef.current?.offsetHeight ?? 320,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (personelProbeRef.current) ro.observe(personelProbeRef.current);
    if (adminProbeRef.current) ro.observe(adminProbeRef.current);
    const frontRef = adminOnTop ? adminRef : personelRef;
    if (frontRef.current) ro.observe(frontRef.current);
    return () => ro.disconnect();
  }, [adminOnTop]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(swap, AUTO_SWAP_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, swap]);

  const personelTop = adminOnTop ? 0 : HEADER_PEEK;
  const adminTop = adminOnTop ? HEADER_PEEK : 0;
  const personelZ = adminOnTop ? 10 : 20;
  const adminZ = adminOnTop ? 20 : 10;
  const frontHeight = adminOnTop ? heights.admin : heights.personel;
  const stackHeight = HEADER_PEEK + frontHeight;

  return (
    <motion.div
      className="relative isolate sm:hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative" style={{ minHeight: stackHeight }}>
        <div className="pointer-events-none absolute -left-[9999px] top-0 w-full max-w-none opacity-0" aria-hidden>
          <article ref={personelProbeRef} className={`flex flex-col rounded-2xl border p-6 ${apps[0].cardClass}`}>
            <AppCardHeader app={apps[0]} />
            <p className="mt-5 text-sm">{apps[0].description}</p>
            <div className={`mt-6 border-t pt-5 ${apps[0].dividerClass}`}>
              <div className="h-14" />
            </div>
          </article>
          <article ref={adminProbeRef} className={`mt-4 flex flex-col rounded-2xl border p-6 ${apps[1].cardClass}`}>
            <AppCardHeader app={apps[1]} />
            <p className="mt-5 text-sm">{apps[1].description}</p>
            <div className={`mt-6 border-t pt-5 ${apps[1].dividerClass}`}>
              <div className="h-14" />
            </div>
          </article>
        </div>

        <motion.div
          className="absolute inset-x-0 will-change-transform"
          animate={{ top: personelTop, zIndex: personelZ }}
          transition={springTransition}
        >
          <MobileStackCard
            app={apps[0]}
            isFront={!adminOnTop}
            cardRef={personelRef}
            onHeaderClick={swap}
          />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 will-change-transform"
          animate={{ top: adminTop, zIndex: adminZ }}
          transition={springTransition}
        >
          <MobileStackCard app={apps[1]} isFront={adminOnTop} cardRef={adminRef} onHeaderClick={swap} />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function PlayStoreSection() {
  return (
    <section id="play-store" className="relative overflow-hidden py-20 lg:py-24">
      <BrandIconRain />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <GooglePlayIcon className="h-4 w-4" />
            Mobil Uygulama
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Google Play&apos;den indirin
          </h2>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-0">
            <AppCard app={apps[0]} index={0} />
            <CardsConnector layout="row" />
            <AppCard app={apps[1]} index={1} />
          </div>

          <MobileStackedAppCards />
        </div>
      </div>
    </section>
  );
}
