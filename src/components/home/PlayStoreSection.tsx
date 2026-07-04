'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';
import { BrandIconRain } from '@/components/home/BrandIconRain';
import {
  PLAY_STORE_ADMIN_ICON,
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_PERSONNEL_ICON,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';
import strings from '@json/src/components/home/PlayStoreSection.json';

const apps = [
  {
    id: 'personel' as const,
    title: strings.apps.personel.title,
    description: strings.apps.personel.description,
    playUrl: PLAY_STORE_PERSONNEL_URL,
    iconSrc: PLAY_STORE_PERSONNEL_ICON,
  },
  {
    id: 'admin' as const,
    title: strings.apps.admin.title,
    description: strings.apps.admin.description,
    playUrl: PLAY_STORE_ADMIN_URL,
    iconSrc: PLAY_STORE_ADMIN_ICON,
  },
];

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
          <Image src={app.iconSrc} alt="" width={56} height={56} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{strings.platformLabel}</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{app.title}</h3>
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{app.description}</p>

      <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800 space-y-3">
        <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} fullWidth />
        <Link
          href="/apk"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
        >
          {strings.apkDownload}
        </Link>
      </div>
    </motion.article>
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
            {strings.sectionBadge}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {strings.sectionTitle}
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {strings.sectionSubtitlePrefix}{' '}
            <Link href="/apk" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              {strings.sectionSubtitleLink}
            </Link>{' '}
            {strings.sectionSubtitleSuffix}
          </p>
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
