'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Çift Onaylı Yevmiye',
    description:
      'Tam/yarım gün puantaj ve çeyrek, yarım, tam mesai kaydı. Yönetici girer; personel onaylar veya itiraz eder — iki taraf onayı olmadan kayıt kesinleşmez.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
  },
  {
    title: 'Avans & Kesinti',
    description:
      'Proje bazında avans ve kesinti girişi. Brüt, avans, kesinti ve net tutar maaş bordrosunda ve personel finans sekmesinde aynı formülle hesaplanır.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
  },
  {
    title: 'Asgari Ücret Tamamlama',
    description:
      'Şirket ve proje maaş politikasına göre hak edilen, ödenen ve kalan tutar. Taşeron farkı önerisi; personel asgari sekmesinde dökümü görür.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
      />
    ),
  },
  {
    title: 'Proje Bazlı Şantiye',
    description:
      'Her şantiye ayrı proje; personel, blok, ekip ve finans kayıtları proje içinde tutulur. Yönetici yalnızca kendi oluşturduğu projelere erişir.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    ),
  },
  {
    title: 'Raporlar & Bordro',
    description:
      'Onaylanan ve bekleyen yevmiyeler, açık personel itirazları, maaş bordroları ile yevmiye, avans ve kesinti arşiv sorgulaması.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    title: 'Personel Uygulaması',
    description:
      'PWA olarak telefona kurulur. Özet, yevmiye, mesai, finans, asgari ve haklarım sekmeleri — yönetici paneliyle aynı veritabanından beslenir.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
  },
] as const;

function FeaturesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function FeatureIconBox({ icon, size = 'md' }: { icon: ReactNode; size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-9 w-9 rounded-lg' : 'h-12 w-12 rounded-xl';
  const svg = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#0E1548] text-white shadow-sm ${box}`}
    >
      <svg className={svg} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        {icon}
      </svg>
    </div>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  return (
    <motion.article
      className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/50 sm:p-7"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <FeatureIconBox icon={feature.icon} />

      <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        {feature.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {feature.description}
      </p>
    </motion.article>
  );
}

function MobileFeatureCarousel() {
  return (
    <div className="md:hidden">
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <FeatureIconBox icon={feature.icon} size="sm" />
            <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {feature.title}
            </h3>
            <p className="mt-1.5 line-clamp-3 text-sm leading-snug text-slate-600 dark:text-slate-400">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Kaydırarak diğer özelliklere geçin
      </p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50/80 py-12 dark:bg-slate-950/50 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start lg:gap-14 xl:gap-20">
          <motion.div
            className="lg:sticky lg:top-28"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 sm:mb-4">
              <FeaturesIcon className="h-4 w-4" />
              Platform Özellikleri
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
              Puantajdan bordroya gerçek modüller
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-base lg:text-lg">
              <span className="md:hidden">Çift onaylı yevmiye, finans ve asgari — proje bazında.</span>
              <span className="hidden md:inline">
                Yevmiye, mesai, avans, kesinti, asgari tamamlama ve bordro proje bazında yönetilir. Personel
                uygulaması yönetici paneliyle aynı kayıtları gösterir; gizli kesinti mimari olarak mümkün değildir.
              </span>
            </p>
            <div
              className="mt-6 hidden h-px w-16 bg-gradient-to-r from-[#0E1548] to-blue-500 lg:block"
              aria-hidden
            />
          </motion.div>

          <div className="mt-6 sm:mt-8 lg:mt-0">
            <MobileFeatureCarousel />

            <div className="hidden md:grid md:grid-cols-2 md:gap-5">
              {features.map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
