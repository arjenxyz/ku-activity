'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';
import {
  PLAY_STORE_ADMIN_URL,
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
    accentBar: 'bg-gradient-to-b from-blue-500 to-indigo-600',
    badgeClass:
      'text-blue-700 bg-blue-50 border-blue-200/80 dark:text-blue-300 dark:bg-blue-950/50 dark:border-blue-800/50',
    panelClass:
      'bg-gradient-to-br from-blue-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30',
    iconRing: 'ring-blue-200/80 dark:ring-blue-800/50',
  },
  {
    id: 'admin',
    badge: 'Yönetici',
    title: 'Yönetici Uygulaması',
    description:
      'Proje yönetimi, personel onayı, yevmiye ve raporlar. Ofisten veya sahada tam kontrol.',
    playUrl: PLAY_STORE_ADMIN_URL,
    accentBar: 'bg-gradient-to-b from-slate-500 to-[#0E1548]',
    badgeClass:
      'text-slate-200 bg-white/10 border-white/15',
    panelClass: 'bg-[#0E1548] text-white',
    iconRing: 'ring-white/20',
  },
] as const;

function AppPanel({
  app,
  index,
}: {
  app: (typeof apps)[number];
  index: number;
}) {
  const hasPlayLink = Boolean(app.playUrl);
  const isNavy = app.id === 'admin';

  return (
    <motion.article
      className={`relative flex flex-col overflow-hidden rounded-2xl border sm:rounded-none sm:border-0 ${
        isNavy
          ? 'border-[#1a2560] sm:border-l sm:border-white/10'
          : 'border-slate-200/80 dark:border-slate-700/70 sm:border-r sm:border-slate-200/80 dark:sm:border-slate-700/70'
      } ${app.panelClass}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.1, duration: 0.45 }}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${app.accentBar}`} aria-hidden />

      <div className="flex flex-1 flex-col p-6 sm:p-8 pl-7 sm:pl-9">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-2 ${app.iconRing} ${isNavy ? '' : 'dark:bg-slate-800'}`}
          >
            <Image src="/crewledger.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${app.badgeClass}`}
              >
                {app.badge}
              </span>
              <span className={`text-[11px] font-medium ${isNavy ? 'text-blue-200/70' : 'text-slate-400'}`}>
                Android · Ücretsiz
              </span>
            </div>
            <h3 className={`mt-2 text-xl font-bold tracking-tight ${isNavy ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {app.title}
            </h3>
          </div>
        </div>

        <p
          className={`mt-4 flex-1 text-sm leading-relaxed sm:text-[15px] ${
            isNavy ? 'text-blue-100/85' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {app.description}
        </p>

        <div className={`mt-6 pt-5 border-t ${isNavy ? 'border-white/10' : 'border-slate-200/80 dark:border-slate-700/70'}`}>
          <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} />
        </div>
      </div>
    </motion.article>
  );
}

export function PlayStoreSection() {
  return (
    <section id="play-store" className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute top-1/4 left-0 h-[380px] w-[380px] rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/5" />
      <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto mb-10 max-w-3xl text-center lg:mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300">
            <GooglePlayIcon className="h-4 w-4" />
            Mobil Uygulama
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Google Play&apos;den{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              indirin
            </span>
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/60 dark:shadow-black/40"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="overflow-hidden rounded-t-[1.75rem]">
            <Image
              src="/banner.png"
              alt="CrewLedger mobil uygulamaları"
              width={749}
              height={208}
              className="block h-auto w-full"
              sizes="(min-width: 1024px) 896px, 100vw"
            />
          </div>

          <div className="grid sm:grid-cols-2">
            {apps.map((app, i) => (
              <AppPanel key={app.id} app={app} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
