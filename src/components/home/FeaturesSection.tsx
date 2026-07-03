'use client';

import type { ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const AUTOPLAY_MS = 4500;
const HEADER_PEEK = 88;
const springTransition = { type: 'spring' as const, stiffness: 260, damping: 28 };

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

function FeatureIconBox({ icon, large = false }: { icon: ReactNode; large?: boolean }) {
  const box = large ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const svg = large ? 'h-7 w-7' : 'h-5 w-5';

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#0E1548] text-white shadow-md shadow-[#0E1548]/25 ${box}`}
    >
      <svg className={svg} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        {icon}
      </svg>
    </div>
  );
}

function FeatureCardHeader({
  feature,
  index,
  isFront,
  onHeaderClick,
}: {
  feature: Feature;
  index: number;
  isFront: boolean;
  onHeaderClick?: () => void;
}) {
  const indexLabel = String(index + 1).padStart(2, '0');
  const totalLabel = String(features.length).padStart(2, '0');

  const content = (
    <div className="flex items-center gap-3">
      <FeatureIconBox icon={feature.icon} large={isFront} />
      <div className="min-w-0">
        <span className="inline-flex rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
          {feature.tag}
        </span>
        <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">
          {indexLabel} / {totalLabel}
        </p>
        <h3
          className={`mt-1 font-bold tracking-tight text-slate-900 dark:text-white ${
            isFront ? 'text-xl' : 'text-base'
          }`}
        >
          {feature.title}
        </h3>
      </div>
    </div>
  );

  if (onHeaderClick) {
    return (
      <button
        type="button"
        onClick={onHeaderClick}
        className="w-full rounded-xl text-left transition-colors active:bg-slate-50 dark:active:bg-slate-800/50"
        aria-label={`${feature.title} — sonraki özelliğe geç`}
      >
        {content}
      </button>
    );
  }

  return content;
}

function FeatureStackCard({
  feature,
  featureIndex,
  isFront,
  onHeaderClick,
  cardRef,
}: {
  feature: Feature;
  featureIndex: number;
  isFront: boolean;
  onHeaderClick?: () => void;
  cardRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <article
      ref={cardRef as RefObject<HTMLElement>}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${
        isFront ? 'shadow-md ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'shadow-sm'
      }`}
    >
      <div
        className="absolute inset-x-0 top-0 z-10 h-1 rounded-t-2xl bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
        aria-hidden
      />
      <FeatureCardHeader
        feature={feature}
        index={featureIndex}
        isFront={isFront}
        onHeaderClick={onHeaderClick}
      />
      {isFront && (
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
      )}
    </article>
  );
}

function MobileStackedFeatures() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [peekOnTop, setPeekOnTop] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const frontRef = useRef<HTMLElement>(null);
  const peekRef = useRef<HTMLElement>(null);
  const [heights, setHeights] = useState({ front: 220, peek: 88 });

  const frontFeature = features[activeIndex];
  const peekFeature = features[(activeIndex + 1) % features.length];
  const peekIndex = (activeIndex + 1) % features.length;

  const advance = useCallback(() => {
    setPeekOnTop((v) => !v);
    setActiveIndex((i) => (i + 1) % features.length);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const measure = () => {
      setHeights({
        front: frontRef.current?.offsetHeight ?? 220,
        peek: peekRef.current?.offsetHeight ?? 88,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (frontRef.current) ro.observe(frontRef.current);
    if (peekRef.current) ro.observe(peekRef.current);
    return () => ro.disconnect();
  }, [activeIndex, peekOnTop]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(advance, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, advance]);

  const topFeature = peekOnTop ? peekFeature : frontFeature;
  const bottomFeature = peekOnTop ? frontFeature : peekFeature;
  const topIndex = peekOnTop ? peekIndex : activeIndex;
  const bottomIndex = peekOnTop ? activeIndex : peekIndex;

  const topPos = peekOnTop ? 0 : HEADER_PEEK;
  const bottomPos = peekOnTop ? HEADER_PEEK : 0;
  const topZ = peekOnTop ? 10 : 20;
  const bottomZ = peekOnTop ? 20 : 10;

  const topIsFront = topFeature.title === frontFeature.title;
  const bottomIsFront = bottomFeature.title === frontFeature.title;

  const stackHeight = HEADER_PEEK + Math.max(heights.front, heights.peek);

  return (
    <div
      className="md:hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative" style={{ minHeight: stackHeight }}>
        <motion.div
          className="absolute inset-x-0"
          animate={{ top: topPos, zIndex: topZ }}
          transition={springTransition}
        >
          <FeatureStackCard
            feature={topFeature}
            featureIndex={topIndex}
            isFront={topIsFront}
            onHeaderClick={advance}
            cardRef={topIsFront ? frontRef : peekRef}
          />
        </motion.div>

        <motion.div
          className="absolute inset-x-0"
          animate={{ top: bottomPos, zIndex: bottomZ }}
          transition={springTransition}
        >
          <FeatureStackCard
            feature={bottomFeature}
            featureIndex={bottomIndex}
            isFront={bottomIsFront}
            onHeaderClick={advance}
            cardRef={bottomIsFront ? frontRef : peekRef}
          />
        </motion.div>
      </div>
    </div>
  );
}

function DesktopFeatureCarousel() {
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
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, goNext]);

  const feature = features[active];
  const indexLabel = String(active + 1).padStart(2, '0');
  const totalLabel = String(features.length).padStart(2, '0');

  return (
    <div
      className="relative hidden md:block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div
          className="absolute inset-x-0 top-0 z-10 h-1 rounded-t-2xl bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-2xl px-5 pb-5 pt-6 sm:px-7 sm:pb-7 sm:pt-8 lg:px-8 lg:pb-8 lg:pt-9">
          <div className="relative min-h-[220px] lg:min-h-[240px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={feature.title}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -28 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex h-full flex-col"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <FeatureIconBox icon={feature.icon} large />
                    <div>
                      <p className="font-mono text-xs text-slate-400 dark:text-slate-500">
                        {indexLabel} / {totalLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Önceki özellik"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Sonraki özellik"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                  {feature.description}
                </p>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ul className="mt-4 hidden gap-2 lg:grid lg:grid-cols-3">
        {features.map((item, i) => {
          const isActive = i === active;
          const isNext = i === (active + 1) % features.length;
          const isPrev = i === (active - 1 + features.length) % features.length;
          if (!isActive && !isNext && !isPrev) return null;

          return (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => goTo(i)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? 'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/30'
                    : 'border-transparent bg-white/60 opacity-70 hover:opacity-100 dark:bg-slate-900/40'
                }`}
              >
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50/80 py-12 dark:bg-slate-950/50 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start lg:gap-12 xl:gap-16">
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
                uygulaması yönetici paneliyle aynı kayıtları gösterir.
              </span>
            </p>
            <div
              className="mt-6 hidden h-px w-16 bg-gradient-to-r from-[#0E1548] to-blue-500 lg:block"
              aria-hidden
            />
          </motion.div>

          <div className="mt-6 sm:mt-8 lg:mt-0">
            <MobileStackedFeatures />
            <DesktopFeatureCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
