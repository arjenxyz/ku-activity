'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const AUTOPLAY_MS = 4500;
const springTransition = { type: 'spring' as const, stiffness: 300, damping: 32 };
const fadeTransition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

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
    tag: 'Mobil PWA',
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

function FeatureIconBox({ icon, large }: { icon: ReactNode; large?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E1548] to-indigo-700 text-white shadow-lg shadow-[#0E1548]/20 ${
        large ? 'h-16 w-16' : 'h-12 w-12'
      }`}
    >
      <svg
        className={large ? 'h-8 w-8' : 'h-6 w-6'}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        {icon}
      </svg>
    </div>
  );
}

function FeatureContent({ feature, index }: { feature: Feature; index: number }) {
  const indexLabel = String(index + 1).padStart(2, '0');
  const totalLabel = String(features.length).padStart(2, '0');

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="flex items-start justify-between gap-4">
        <FeatureIconBox icon={feature.icon} large />
        <span className="font-mono text-sm text-slate-400 dark:text-slate-500">
          {indexLabel}/{totalLabel}
        </span>
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
        {feature.tag}
      </p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
        {feature.title}
      </h3>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
        {feature.description}
      </p>
    </div>
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

  return { active, paused, setPaused, reducedMotion, goTo };
}

function TabProgress({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.span
      key="progress"
      className="absolute bottom-0 left-0 h-0.5 bg-[#0E1548] dark:bg-blue-400"
      initial={{ width: '0%' }}
      animate={{ width: '100%' }}
      transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
      aria-hidden
    />
  );
}

function DesktopFeaturePanel({
  active,
  paused,
  reducedMotion,
  goTo,
  setPaused,
}: {
  active: number;
  paused: boolean;
  reducedMotion: boolean;
  goTo: (index: number) => void;
  setPaused: (value: boolean) => void;
}) {
  return (
    <div
      className="hidden lg:grid lg:min-h-[420px] lg:grid-cols-[240px_minmax(0,1fr)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <nav
        className="flex flex-col border-r border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50"
        role="tablist"
        aria-label="Özellik seçimi"
      >
        {features.map((item, i) => {
          const isActive = i === active;
          return (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => goTo(i)}
              className={`relative overflow-hidden rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-white text-[#0E1548] shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              {item.tag}
              <TabProgress show={isActive && !reducedMotion && !paused} />
            </button>
          );
        })}
      </nav>

      <div className="relative overflow-hidden px-10 py-10 xl:px-12 xl:py-12" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={features[active].title}
            initial={reducedMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -16 }}
            transition={fadeTransition}
          >
            <FeatureContent feature={features[active]} index={active} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MobileFeatureCarousel({
  active,
  paused,
  reducedMotion,
  goTo,
  setPaused,
}: {
  active: number;
  paused: boolean;
  reducedMotion: boolean;
  goTo: (index: number) => void;
  setPaused: (value: boolean) => void;
}) {
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
      className="lg:hidden"
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <motion.div
          className="flex w-full"
          animate={{ x: `-${active * 100}%` }}
          transition={reducedMotion ? { duration: 0 } : springTransition}
          aria-live="polite"
        >
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="box-border w-full shrink-0 grow-0 basis-full px-5 py-7 sm:px-7 sm:py-8"
            >
              <FeatureContent feature={feature} index={index} />
            </article>
          ))}
        </motion.div>
      </div>

      <div className="relative border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-slate-50/95 to-transparent dark:from-slate-900/95"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-slate-50/95 to-transparent dark:from-slate-900/95"
          aria-hidden
        />
        <div
          ref={pillListRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
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
                className={`relative shrink-0 overflow-hidden rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-[#0E1548] bg-[#0E1548] text-white'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {isActive && !reducedMotion && !paused && (
                  <motion.span
                    key={`progress-${active}`}
                    className="absolute inset-y-0 left-0 bg-white/20"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                    aria-hidden
                  />
                )}
                <span className="relative">{item.tag}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeatureShowcase() {
  const { active, paused, setPaused, reducedMotion, goTo } = useFeatureCarousel();

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div
        className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
        aria-hidden
      />

      <DesktopFeaturePanel
        active={active}
        paused={paused}
        reducedMotion={reducedMotion}
        goTo={goTo}
        setPaused={setPaused}
      />
      <MobileFeatureCarousel
        active={active}
        paused={paused}
        reducedMotion={reducedMotion}
        goTo={goTo}
        setPaused={setPaused}
      />
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="overflow-x-hidden bg-slate-50/80 py-12 dark:bg-slate-950/50 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl"
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

        <div className="mt-8 sm:mt-10 lg:mt-12">
          <FeatureShowcase />
        </div>
      </div>
    </section>
  );
}
