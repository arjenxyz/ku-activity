'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';
import {
  PLAY_STORE_ADMIN_ICON,
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_PERSONNEL_ICON,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';

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
      'text-blue-700 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-900/50',
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
      'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
  },
] as const;

type App = (typeof apps)[number];
type AppId = App['id'];

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

function AppHeaderPrimary({ app, onSelect }: { app: App; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-xl text-left transition-colors active:bg-slate-50 dark:active:bg-slate-800/50"
      aria-label={`${app.title} — diğer uygulamaya geç`}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-700">
        <Image src={app.iconSrc} alt="" width={56} height={56} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${app.badgeClass}`}
          >
            {app.badge}
          </span>
          <span className="text-xs text-slate-400">Android · Ücretsiz</span>
        </div>
        <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{app.title}</h3>
      </div>
    </button>
  );
}

function AppHeaderCompact({ app, onSelect }: { app: App; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-left transition-colors active:border-slate-300 active:bg-slate-100/80 dark:border-slate-700 dark:bg-slate-800/50 dark:active:bg-slate-800"
      aria-label={`${app.title} — diğer uygulamaya geç`}
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200/80 dark:ring-slate-700">
        <Image src={app.iconSrc} alt="" width={40} height={40} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${app.badgeClass}`}
        >
          {app.badge}
        </span>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{app.title}</p>
      </div>
      <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </button>
  );
}

function MobileSwappableAppCard() {
  const [activeId, setActiveId] = useState<AppId>('personel');
  const activeApp = apps.find((a) => a.id === activeId)!;
  const otherApp = apps.find((a) => a.id !== activeId)!;

  const swap = () => setActiveId((id) => (id === 'personel' ? 'admin' : 'personel'));

  return (
    <motion.article
      className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
    >
      <LayoutGroup id="play-store-mobile-headers">
        <div className="space-y-3">
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            key={`primary-${activeId}`}
          >
            <AppHeaderPrimary app={activeApp} onSelect={swap} />
          </motion.div>

          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            key={`compact-${otherApp.id}`}
          >
            <AppHeaderCompact app={otherApp} onSelect={swap} />
          </motion.div>
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{activeApp.description}</p>

          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <GooglePlayBadge href={activeApp.playUrl} enabled={Boolean(activeApp.playUrl)} fullWidth />
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.article>
  );
}

function AppCard({ app, index }: { app: App; index: number }) {
  const hasPlayLink = Boolean(app.playUrl);

  return (
    <motion.article
      className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-7"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-700">
          <Image
            src={app.iconSrc}
            alt=""
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${app.badgeClass}`}
            >
              {app.badge}
            </span>
            <span className="text-xs text-slate-400">Android · Ücretsiz</span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{app.title}</h3>
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{app.description}</p>

      <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} fullWidth />
      </div>
    </motion.article>
  );
}

export function PlayStoreSection() {
  return (
    <section id="play-store" className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

          <MobileSwappableAppCard />
        </div>
      </div>
    </section>
  );
}
