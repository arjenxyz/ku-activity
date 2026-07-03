'use client';

import Link from 'next/link';
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
    tagline: 'Sahada her gün ihtiyacınız olan her şey',
    description:
      'Yoklama, yevmiye, mesai ve bordro görüntüleme. Başvuru ve günlük işlemler için tasarlandı.',
    features: ['QR Yoklama', 'Yevmiye & Mesai', 'Bordro', 'Başvuru'],
    playUrl: PLAY_STORE_PERSONNEL_URL,
    webFallback: '/personnel-panel/basvuru',
    webLabel: 'Web sürümünü aç',
    gradient: 'from-blue-500 via-blue-600 to-indigo-700',
    glow: 'bg-blue-500/30',
    cardBg: 'from-blue-50/90 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40',
    border: 'border-blue-200/60 dark:border-blue-500/20',
    iconBg: 'from-blue-400 to-indigo-600',
    accent: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/20',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9 10a3 3 0 106 0"
        />
      </svg>
    ),
  },
  {
    id: 'admin',
    badge: 'Yönetici',
    title: 'Yönetici Uygulaması',
    tagline: 'Şantiye operasyonu tek elden',
    description:
      'Proje yönetimi, personel onayı, yevmiye ve raporlar. Ofisten veya sahada tam kontrol.',
    features: ['Proje Yönetimi', 'Başvuru Onayı', 'Yevmiye', 'Raporlar'],
    playUrl: PLAY_STORE_ADMIN_URL,
    webFallback: '/admin-panel/login',
    webLabel: 'Web sürümünü aç',
    gradient: 'from-slate-700 via-slate-800 to-slate-950',
    glow: 'bg-slate-500/25',
    cardBg: 'from-slate-50/90 via-white to-slate-100/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950',
    border: 'border-slate-200/80 dark:border-slate-600/30',
    iconBg: 'from-slate-600 to-slate-900',
    accent: 'text-slate-700 dark:text-slate-300',
    ring: 'ring-slate-500/20',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
] as const;

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
      className={`group relative overflow-hidden rounded-[1.75rem] border ${app.border} bg-gradient-to-br ${app.cardBg} shadow-xl shadow-slate-200/50 dark:shadow-black/30 transition-shadow hover:shadow-2xl hover:shadow-slate-300/40 dark:hover:shadow-black/50`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
    >
      {/* Dekoratif üst şerit */}
      <div className={`relative h-28 sm:h-32 bg-gradient-to-br ${app.gradient} overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className={`absolute -right-8 -top-8 h-40 w-40 rounded-full ${app.glow} blur-2xl`} />
        <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-xl" />

        {/* Telefon silüeti */}
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 opacity-90">
          <div className="relative h-[88px] w-[44px] sm:h-[100px] sm:w-[50px] rounded-[14px] border-[2.5px] border-white/40 bg-white/10 backdrop-blur-md shadow-2xl">
            <div className="absolute left-1/2 top-2 h-1 w-6 -translate-x-1/2 rounded-full bg-white/50" />
            <div className="absolute inset-x-1.5 top-5 bottom-3 rounded-md bg-white/15 overflow-hidden">
              <div className={`h-full w-full bg-gradient-to-b ${app.gradient} opacity-60`} />
              <div className="absolute inset-x-1 top-2 space-y-1">
                <div className="h-1 w-3/4 rounded bg-white/50" />
                <div className="h-1 w-1/2 rounded bg-white/30" />
                <div className="h-1 w-2/3 rounded bg-white/25" />
              </div>
            </div>
          </div>
        </div>

        {/* Uygulama ikonu */}
        <div className="absolute left-5 sm:left-7 bottom-0 translate-y-1/2">
          <div
            className={`flex h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${app.iconBg} text-white shadow-2xl ring-4 ring-white dark:ring-slate-900 ${app.ring} transition-transform group-hover:scale-105`}
          >
            {app.icon}
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-7 pt-12 sm:pt-14 pb-6 sm:pb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${app.accent} bg-white/80 dark:bg-slate-800/80 border ${app.border}`}
          >
            {app.badge}
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Android · Ücretsiz
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {app.title}
        </h3>
        <p className={`mt-1 text-sm font-semibold ${app.accent}`}>{app.tagline}</p>
        <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
          {app.description}
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {app.features.map((feature) => (
            <li
              key={feature}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm"
            >
              <svg className="h-3 w-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-7 pt-6 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center gap-4">
          <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} />
          <Link
            href={app.webFallback}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
              app.id === 'personel'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                : 'bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-500/20 dark:bg-slate-700 dark:hover:bg-slate-600'
            }`}
          >
            {app.webLabel}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function PlayStoreSection() {
  return (
    <section id="play-store" className="relative py-20 lg:py-28 pb-28 lg:pb-36 overflow-hidden">
      {/* Arka plan */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-400/8 via-blue-400/10 to-transparent dark:from-emerald-500/5 dark:via-blue-500/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-400/8 dark:bg-indigo-500/5 rounded-full blur-3xl translate-x-1/3" />
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 sm:h-52 bg-gradient-to-b from-transparent via-white/90 to-white dark:via-slate-950/90 dark:to-slate-950"
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-14 lg:mb-20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/80 dark:bg-emerald-950/40 px-4 py-2 mb-6 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200/80 bg-white shadow-md dark:border-emerald-800/50 dark:bg-slate-900">
              <GooglePlayIcon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 tracking-wide">
              Mobil Uygulama
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            Google Play&apos;den{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              indirin
            </span>
          </h2>
          <p className="mt-5 text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Personel ve yönetici için ayrı uygulamalar. Kurulum gerektirmez; telefonunuzdan hemen
            kullanmaya başlayın.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            {[
              { icon: '📱', label: 'Android uyumlu' },
              { icon: '⚡', label: 'Anında erişim' },
              { icon: '🔒', label: 'Güvenli giriş' },
            ].map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2 font-medium">
                <span className="text-base" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {apps.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} />
          ))}
        </div>

        <motion.p
          className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          Mağaza bağlantıları yayınlandığında burada görünür. Şimdilik tarayıcıdan da aynı panellere
          erişebilirsiniz.
        </motion.p>
      </div>
    </section>
  );
}
