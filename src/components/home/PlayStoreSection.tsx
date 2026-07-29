'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';
import { BrandIconRain } from '@/components/home/BrandIconRain';
import { PLAY_STORE_PERSONNEL_ICON, PLAY_STORE_PERSONNEL_URL } from '@/lib/play-store';

export function PlayStoreSection() {
  const strings = useRegistryStrings('components/home/PlayStoreSection');

  const app = useMemo(
    () => ({
      title: strings.apps.personel.title,
      description: strings.apps.personel.description,
      playUrl: PLAY_STORE_PERSONNEL_URL,
      iconSrc: PLAY_STORE_PERSONNEL_ICON,
    }),
    [strings]
  );

  const hasPlayLink = Boolean(app.playUrl);

  return (
    <section id="play-store" className="relative overflow-hidden py-10 sm:py-12">
      <BrandIconRain />
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:p-5"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-24px' }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80">
                <Image
                  src={app.iconSrc}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <GooglePlayIcon className="h-3.5 w-3.5" />
                  {strings.sectionBadge}
                </div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  {strings.sectionTitle}
                </h2>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{app.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                  {app.description}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {strings.sectionSubtitlePrefix}{' '}
                  <Link href="/apk" className="font-medium text-blue-600 hover:underline">
                    {strings.sectionSubtitleLink}
                  </Link>{' '}
                  {strings.sectionSubtitleSuffix}
                </p>
              </div>
            </div>

            <div className="w-full shrink-0 sm:w-[200px]">
              <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} fullWidth />
              <p className="mt-1.5 text-center text-[10px] text-slate-400">{strings.platformLabel}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
