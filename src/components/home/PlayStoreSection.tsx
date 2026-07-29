'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';
import { BrandIconRain } from '@/components/home/BrandIconRain';
import { PLAY_STORE_PERSONNEL_ICON, PLAY_STORE_PERSONNEL_URL } from '@/lib/play-store';

type PlayStoreApp = {
  title: string;
  description: string;
  playUrl: string;
  iconSrc: string;
};

function AppCard({
  app,
  platformLabel,
}: {
  app: PlayStoreApp;
  platformLabel: string;
}) {
  const hasPlayLink = Boolean(app.playUrl);

  return (
    <motion.article
      className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-7"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-700">
          <Image src={app.iconSrc} alt="" width={56} height={56} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{platformLabel}</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{app.title}</h3>
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
  const strings = useRegistryStrings('components/home/PlayStoreSection');

  const app = useMemo<PlayStoreApp>(
    () => ({
      title: strings.apps.personel.title,
      description: strings.apps.personel.description,
      playUrl: PLAY_STORE_PERSONNEL_URL,
      iconSrc: PLAY_STORE_PERSONNEL_ICON,
    }),
    [strings]
  );

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

        <div className="mx-auto max-w-md">
          <AppCard app={app} platformLabel={strings.platformLabel} />
        </div>
      </div>
    </section>
  );
}
