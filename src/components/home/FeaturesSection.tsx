'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: 'Yevmiye Yönetimi',
    description:
      'Günlük çalışma kayıtları, mesai hesaplamaları ve proje bazlı yevmiye takibi — şantiyede tek akış.',
    category: 'Operasyon',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    variant: 'hero' as const,
    className: 'md:col-span-2 lg:col-span-2 lg:row-span-2',
  },
  {
    title: 'Avans Takibi',
    description: 'Talep, onay ve kesinti hesaplamaları tek ekranda.',
    category: 'Finans',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
    variant: 'light' as const,
    className: 'md:col-span-1',
  },
  {
    title: 'Proje Yönetimi',
    description: 'Çoklu şantiye, personel ve maliyet verileri proje bazında ayrılmış.',
    category: 'Şantiye',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    ),
    variant: 'navy' as const,
    className: 'md:col-span-1',
  },
  {
    title: 'Detaylı Raporlama',
    description: 'Yevmiye, avans ve iş gücü verilerini raporlanabilir özetlere dönüştürün.',
    category: 'Analiz',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
    variant: 'light' as const,
    className: 'md:col-span-1',
  },
  {
    title: 'Güvenli Veri Saklama',
    description: 'Rol tabanlı erişim ve şifreli depolama ile hassas kayıtlar korunur.',
    category: 'Güvenlik',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
    variant: 'navy' as const,
    className: 'md:col-span-1 lg:col-span-2',
  },
  {
    title: 'Personel Paneli',
    description: 'Çalışanlar yevmiye, avans ve çalışma geçmişini kendi ekranlarından görür.',
    category: 'Mobil',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
    variant: 'gradient' as const,
    className: 'md:col-span-1',
  },
] as const;

type Feature = (typeof features)[number];

const variantStyles: Record<
  Feature['variant'],
  {
    card: string;
    icon: string;
    category: string;
    title: string;
    description: string;
    glow: string;
  }
> = {
  hero: {
    card: 'border-blue-200/70 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/80 dark:border-blue-500/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/50',
    icon: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30',
    category: 'text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-800/50',
    title: 'text-slate-900 dark:text-white',
    description: 'text-slate-600 dark:text-slate-400',
    glow: 'bg-blue-400/20',
  },
  light: {
    card: 'border-slate-200/80 bg-white/90 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/80',
    icon: 'bg-slate-100 text-blue-700 dark:bg-slate-800 dark:text-blue-300',
    category: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    title: 'text-slate-900 dark:text-white',
    description: 'text-slate-600 dark:text-slate-400',
    glow: 'bg-blue-400/10',
  },
  navy: {
    card: 'border-[#1a2560] bg-[#0E1548] text-white shadow-xl shadow-[#0E1548]/20',
    icon: 'bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm',
    category: 'text-blue-200 bg-white/10 border-white/15',
    title: 'text-white',
    description: 'text-blue-100/85',
    glow: 'bg-blue-400/15',
  },
  gradient: {
    card: 'border-transparent bg-gradient-to-br from-blue-600 via-indigo-600 to-[#0E1548] text-white shadow-xl shadow-indigo-500/25',
    icon: 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm',
    category: 'text-indigo-100 bg-white/10 border-white/15',
    title: 'text-white',
    description: 'text-blue-100/90',
    glow: 'bg-white/10',
  },
};

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const styles = variantStyles[feature.variant];
  const isHero = feature.variant === 'hero';

  return (
    <motion.article
      className={`group relative overflow-hidden rounded-[1.5rem] border p-5 sm:p-6 ${styles.card} ${feature.className} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${styles.glow}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232563eb' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className={`relative flex h-full flex-col ${isHero ? 'justify-between min-h-[220px] lg:min-h-[280px]' : ''}`}>
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles.category}`}
            >
              {feature.category}
            </span>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                {feature.icon}
              </svg>
            </div>
          </div>

          <h3 className={`text-lg font-bold tracking-tight sm:text-xl ${styles.title} ${isHero ? 'sm:text-2xl' : ''}`}>
            {feature.title}
          </h3>
          <p className={`mt-2 text-sm leading-relaxed ${styles.description} ${isHero ? 'sm:text-base max-w-md' : ''}`}>
            {feature.description}
          </p>
        </div>

        {isHero && (
          <div className="mt-6 flex flex-wrap gap-2">
            {['Günlük kayıt', 'Mesai', 'Proje bazlı'].map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-blue-200/70 bg-white/70 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:border-blue-800/50 dark:bg-slate-900/60 dark:text-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute top-0 left-1/4 h-[420px] w-[420px] rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/5" />
      <div className="absolute bottom-0 right-1/4 h-[360px] w-[360px] rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            Platform Özellikleri
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Şantiye operasyonu için{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              uçtan uca platform
            </span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Yevmiyeden raporlamaya kadar tüm personel süreçleri tek panelde. Sahada ve ofiste aynı veri,
            aynı doğruluk.
          </p>
        </motion.div>

        <div className="mt-14 grid auto-rows-fr grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
