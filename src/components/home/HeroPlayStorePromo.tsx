'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';

const heroApps = [
  {
    id: 'personel',
    badge: 'Personel',
    title: 'Personel Uygulaması',
    subtitle: 'Yoklama, yevmiye, mesai',
    features: ['QR Yoklama', 'Bordro', 'Başvuru'],
    playUrl: PLAY_STORE_PERSONNEL_URL,
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/30',
    ring: 'ring-blue-400/30',
    chipBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800',
  },
  {
    id: 'admin',
    badge: 'Yönetici',
    title: 'Yönetici Uygulaması',
    subtitle: 'Proje, onay, raporlar',
    features: ['Proje', 'Onay', 'Raporlar'],
    playUrl: PLAY_STORE_ADMIN_URL,
    gradient: 'from-slate-600 to-slate-900',
    glow: 'shadow-slate-500/25',
    ring: 'ring-slate-400/25',
    chipBg: 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
] as const;

export function HeroPlayStorePromo() {
  return (
    <motion.div
      className="relative hidden lg:block"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
    >
      {/* Dekoratif glow */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/20 via-blue-500/15 to-indigo-500/20 blur-2xl" />
      <div className="absolute top-8 -right-4 h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -bottom-6 left-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/60 dark:border-slate-700/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-2xl shadow-blue-900/10 dark:shadow-black/40">
        {/* Üst gradient şerit */}
        <div className="relative h-24 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 overflow-hidden">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.5' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

          <div className="relative flex h-full items-center justify-between px-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
                <GooglePlayIcon className="h-3.5 w-3.5" />
                Google Play
              </div>
              <p className="mt-2 text-lg font-bold text-white tracking-tight">
                Uygulamayı indirin
              </p>
            </div>

            {/* Telefon mockup */}
            <motion.div
              className="relative mr-2"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="relative h-[108px] w-[54px] rounded-[18px] border-[3px] border-white/50 bg-slate-900 shadow-2xl shadow-black/30">
                <div className="absolute left-1/2 top-2.5 h-1 w-7 -translate-x-1/2 rounded-full bg-white/30" />
                <div className="absolute inset-[5px] rounded-[12px] overflow-hidden bg-slate-950">
                  <Image
                    src="/crewledger.png"
                    alt=""
                    width={44}
                    height={44}
                    className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-lg"
                  />
                  <div className="absolute inset-x-1 bottom-2 space-y-1">
                    <div className="h-1 rounded bg-white/20" />
                    <div className="h-1 w-2/3 rounded bg-white/15" />
                    <div className="h-1 w-1/2 rounded bg-emerald-400/40" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-black/20 blur-md" />
            </motion.div>
          </div>
        </div>

        <div className="p-6 xl:p-7 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Personel ve yönetici için ayrı Android uygulamaları. Sahada anında erişim, güvenli giriş.
          </p>

          {heroApps.map((app, i) => (
            <motion.div
              key={app.id}
              className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/60 dark:to-slate-900/60 p-4 transition-shadow hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${app.gradient} text-white shadow-lg ${app.glow} ring-2 ${app.ring}`}
                >
                  <Image
                    src="/crewledger.png"
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${app.chipBg}`}
                    >
                      {app.badge}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">Android · Ücretsiz</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{app.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{app.subtitle}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {app.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center rounded-md bg-white/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-600 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3.5">
                    <GooglePlayBadge href={app.playUrl} enabled={Boolean(app.playUrl)} size="sm" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                Güvenli giriş
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Anında erişim
              </span>
            </div>
            <Link
              href="#play-store"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Detaylar →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
