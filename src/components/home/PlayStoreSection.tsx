'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
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

function CardsConnector({ layout }: { layout: 'row' | 'column' }) {
  const badge = (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white shadow-lg ring-4 ring-slate-50 dark:border-slate-600 dark:bg-[#0E1548] dark:ring-slate-950">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/15" aria-hidden />
      <GooglePlayIcon className="relative h-6 w-6" />
    </div>
  );

  if (layout === 'column') {
    return (
      <div className="flex items-center justify-center py-1" aria-hidden>
        <div className="h-px flex-1 max-w-[4.5rem] bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
        {badge}
        <div className="h-px flex-1 max-w-[4.5rem] bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center px-2 sm:px-3" aria-hidden>
      <div className="min-h-6 w-px flex-1 bg-gradient-to-b from-transparent via-slate-200 to-slate-300 dark:via-slate-700" />
      {badge}
      <div className="min-h-6 w-px flex-1 bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-slate-700" />
    </div>
  );
}

function AppCard({
  app,
  index,
}: {
  app: (typeof apps)[number];
  index: number;
}) {
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
          <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {app.title}
          </h3>
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {app.description}
      </p>

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
        <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} />
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

          <div className="space-y-4 sm:hidden">
            <AppCard app={apps[0]} index={0} />
            <CardsConnector layout="column" />
            <AppCard app={apps[1]} index={1} />
          </div>
        </div>
      </div>
    </section>
  );
}
