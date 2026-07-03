'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { PLAY_STORE_ADMIN_ICON, PLAY_STORE_PERSONNEL_ICON } from '@/lib/play-store';
import { GooglePlayIcon } from '@/components/home/GooglePlayBadge';

const heroApps = [
  { id: 'personel', iconSrc: PLAY_STORE_PERSONNEL_ICON },
  { id: 'admin', iconSrc: PLAY_STORE_ADMIN_ICON },
] as const;

export function HeroPlayStorePromo() {
  return (
    <motion.div
      className="relative hidden lg:block"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-400/15 via-blue-500/10 to-teal-400/15 blur-2xl" />

      <a
        href="#play-store"
        className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-xl shadow-[#0E1548]/5 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-900/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30"
      >
        <div
          className="h-1 bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
          aria-hidden
        />

        <Image
          src="/banner.png"
          alt="Google Play'den CrewLedger uygulamasını indirin"
          width={749}
          height={208}
          className="block h-auto w-full"
          sizes="(min-width: 1024px) 50vw"
          priority
        />

        <div className="p-6 xl:p-7">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Android için CrewLedger mobil uygulaması. Personel ve yönetici sürümlerinden birini seçerek
            Google Play&apos;den indirebilirsiniz.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {heroApps.map((app) => (
                  <div
                    key={app.id}
                    className="h-10 w-10 overflow-hidden rounded-xl ring-2 ring-white dark:ring-slate-900"
                  >
                    <Image
                      src={app.iconSrc}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">2 uygulama · Ücretsiz</span>
            </div>

            <span className="inline-flex items-center gap-2 rounded-xl bg-[#0E1548] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:bg-[#151d5c] group-hover:shadow-xl">
              <GooglePlayIcon className="h-5 w-5" />
              Uygulama seç
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </div>
        </div>
      </a>
    </motion.div>
  );
}
