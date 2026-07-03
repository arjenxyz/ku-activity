'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const AUTOPLAY_MS = 4500;
const springTransition = { type: 'spring' as const, stiffness: 300, damping: 32 };

const features = [
  {
    title: 'Çift Onaylı Yevmiye',
    tag: 'Puantaj',
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
    tag: 'Finans',
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
    tag: 'Politika',
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
    tag: 'Operasyon',
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
    tag: 'Raporlama',
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
    tag: 'Mobil',
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

type Feature = (typeof features)[number];

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

function FeatureIconBox({ icon }: { icon: ReactNode }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E1548] to-indigo-700 text-white shadow-sm sm:h-12 sm:w-12">
      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        {icon}
      </svg>
    </div>
  );
}

function FeatureCardSlide({ feature }: { feature: Feature }) {
  return (
    <article className="box-border flex min-h-[220px] w-full shrink-0 grow-0 basis-full flex-col justify-center px-6 py-8 sm:min-h-[200px] sm:px-10 sm:py-10 lg:min-h-[180px]">
      <div className="flex items-center gap-3 sm:gap-4">
        <FeatureIconBox icon={feature.icon} />
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {feature.title}
        </h3>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-5 sm:text-base">
        {feature.description}
      </p>
    </article>
  );
}

function useFeatureCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const goTo = useCallback((index: number) => {
    setActive((index + features.length) % features.length);
  }, []);

  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, goNext]);

  return { active, paused, setPaused, reducedMotion, goTo, goNext };
}

function FeatureCarousel() {
  const { active, paused, setPaused, reducedMotion, goTo } = useFeatureCarousel();
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pillListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = pillListRef.current;
    const pill = pillRefs.current[active];
    if (!list || !pill) return;

    const listRect = list.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const targetLeft = pill.offsetLeft - list.offsetLeft - (listRect.width - pillRect.width) / 2;

    list.scrollTo({
      left: targetLeft,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [active, reducedMotion]);

  return (
    <div
      className="min-w-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div
          className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
          aria-hidden
        />

        {!reducedMotion && !paused && (
          <motion.div
            key={`bar-${active}`}
            className="absolute inset-x-0 top-0 z-20 h-1 origin-left bg-white/40"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
            aria-hidden
          />
        )}

        <div className="overflow-hidden">
          <motion.div
            className="flex w-full"
            animate={{ x: `-${active * 100}%` }}
            transition={reducedMotion ? { duration: 0 } : springTransition}
            aria-live="polite"
          >
            {features.map((feature) => (
              <FeatureCardSlide key={feature.title} feature={feature} />
            ))}
          </motion.div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60 sm:px-6">
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-slate-50/95 to-transparent dark:from-slate-900/95 sm:hidden"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-slate-50/95 to-transparent dark:from-slate-900/95 sm:hidden"
              aria-hidden
            />

            <div
              ref={pillListRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth sm:flex-wrap sm:justify-center sm:gap-2 sm:overflow-visible"
              role="tablist"
              aria-label="Özellik seçimi"
            >
              {features.map((item, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={item.title}
                    ref={(el) => {
                      pillRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => goTo(i)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
                      isActive
                        ? 'bg-[#0E1548] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {item.tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="overflow-x-hidden bg-slate-50/80 py-12 dark:bg-slate-950/50 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
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
            Yevmiye, mesai, avans, kesinti, asgari tamamlama ve bordro proje bazında yönetilir. Personel uygulaması
            yönetici paneliyle aynı kayıtları gösterir.
          </p>
        </motion.div>

        <div className="mx-auto mt-8 max-w-4xl sm:mt-10 lg:mt-12">
          <FeatureCarousel />
        </div>
      </div>
    </section>
  );
}
