'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MARQUEE_DURATION_S = 52;

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

function FeatureIconBox({ icon }: { icon: ReactNode }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E1548] to-indigo-700 text-white shadow-md shadow-[#0E1548]/20">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        {icon}
      </svg>
    </div>
  );
}

function FeatureCard({
  feature,
  index,
  selected,
  onSelect,
}: {
  feature: Feature;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}) {
  const indexLabel = String((index % features.length) + 1).padStart(2, '0');
  const totalLabel = String(features.length).padStart(2, '0');

  return (
    <article
      data-feature-card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(index % features.length)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(index % features.length);
        }
      }}
      className={`flex h-full min-h-[300px] w-[min(82vw,320px)] shrink-0 cursor-grab select-none active:cursor-grabbing flex-col rounded-2xl border bg-white p-5 shadow-sm transition-[border-color,box-shadow] sm:w-[320px] sm:p-6 dark:bg-slate-900 ${
        selected
          ? 'border-[#0E1548] ring-2 ring-[#0E1548]/30 shadow-md dark:border-blue-500 dark:ring-blue-500/30'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <FeatureIconBox icon={feature.icon} />
        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
          {indexLabel}/{totalLabel}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        {feature.tag}
      </p>
      <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{feature.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
    </article>
  );
}

function StaticFeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const indexLabel = String(index + 1).padStart(2, '0');
  const totalLabel = String(features.length).padStart(2, '0');

  return (
    <article className="flex min-h-[300px] flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <FeatureIconBox icon={feature.icon} />
        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
          {indexLabel}/{totalLabel}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        {feature.tag}
      </p>
      <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{feature.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
    </article>
  );
}

function FeatureCardGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <StaticFeatureCard key={feature.title} feature={feature} index={index} />
      ))}
    </div>
  );
}

type GestureAxis = 'none' | 'horizontal' | 'vertical';

function InfiniteFeatureMarquee() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragMovedRef = useRef(false);
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    startScroll: 0,
    pointerId: -1,
    moved: false,
    axis: 'none' as GestureAxis,
  });
  const pausedRef = useRef(false);
  const clickPausedRef = useRef(false);
  const ignoreScrollHandlerRef = useRef(false);
  const programmaticScrollSkipsRef = useRef(0);
  const userScrolledRef = useRef(false);
  const scrollResumeTimerRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const [holdPaused, setHoldPaused] = useState(false);
  const [clickPaused, setClickPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const isPaused = holdPaused || clickPaused || isDragging || interactionPaused;

  useEffect(() => {
    pausedRef.current = isPaused;
    clickPausedRef.current = clickPaused;
  }, [isPaused, clickPaused]);

  const scheduleAutoResume = useCallback(() => {
    window.clearTimeout(scrollResumeTimerRef.current);
    scrollResumeTimerRef.current = window.setTimeout(() => {
      userScrolledRef.current = false;
      setInteractionPaused(false);
    }, 1500);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(scrollResumeTimerRef.current);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const normalizeScroll = useCallback((el: HTMLDivElement) => {
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    ignoreScrollHandlerRef.current = true;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    if (el.scrollLeft < 0) el.scrollLeft += half;
    requestAnimationFrame(() => {
      ignoreScrollHandlerRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const el = scrollRef.current;
    if (!el) return;

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!pausedRef.current && el.scrollWidth > 0) {
        const half = el.scrollWidth / 2;
        const speed = half / MARQUEE_DURATION_S;
        programmaticScrollSkipsRef.current = 3;
        el.scrollLeft += speed * dt;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  const lockGestureAxis = useCallback((dx: number, dy: number) => {
    const drag = dragStateRef.current;
    if (drag.axis !== 'none') return drag.axis;

    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return 'none';

    const axis: GestureAxis = Math.abs(dy) > Math.abs(dx) ? 'vertical' : 'horizontal';
    dragStateRef.current.axis = axis;

    if (axis === 'horizontal') {
      setHoldPaused(true);
      setInteractionPaused(true);
      window.clearTimeout(scrollResumeTimerRef.current);
    } else {
      setHoldPaused(false);
    }

    return axis;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0) return;

    dragMovedRef.current = false;
    userScrolledRef.current = false;
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
      moved: false,
      axis: 'none',
    };
    window.clearTimeout(scrollResumeTimerRef.current);
    window.getSelection()?.removeAllRanges();

    if (e.pointerType === 'touch') return;

    setHoldPaused(true);
    setInteractionPaused(true);
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      const drag = dragStateRef.current;
      if (!el || drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      if (e.pointerType === 'touch') {
        const axis = lockGestureAxis(dx, dy);
        if (axis === 'horizontal' && Math.abs(dx) > 8) {
          dragStateRef.current.moved = true;
          dragMovedRef.current = true;
        }
        return;
      }

      if (Math.abs(dx) > 6) {
        dragStateRef.current.moved = true;
        dragMovedRef.current = true;
      }

      el.scrollLeft = drag.startScroll - dx;
      normalizeScroll(el);
    },
    [normalizeScroll, lockGestureAxis],
  );

  const finishPointerInteraction = useCallback(
    (moved: boolean) => {
      setHoldPaused(false);
      setIsDragging(false);

      const didMove = moved || dragMovedRef.current || userScrolledRef.current;
      dragMovedRef.current = didMove;

      if (didMove && !clickPausedRef.current) {
        setInteractionPaused(true);
        scheduleAutoResume();
        return;
      }

      if (!clickPausedRef.current) {
        window.setTimeout(() => {
          if (!clickPausedRef.current && !userScrolledRef.current) {
            setInteractionPaused(false);
          }
        }, 50);
      }
    },
    [scheduleAutoResume],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el) return;

      const drag = dragStateRef.current;
      if (drag.pointerId !== e.pointerId) return;

      if (e.pointerType === 'touch') {
        normalizeScroll(el);
        if (drag.axis === 'vertical') {
          dragStateRef.current.pointerId = -1;
          dragStateRef.current.axis = 'none';
          return;
        }
        finishPointerInteraction(dragMovedRef.current || drag.moved);
        dragStateRef.current.pointerId = -1;
        dragStateRef.current.axis = 'none';
        return;
      }

      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      dragStateRef.current.pointerId = -1;
      dragStateRef.current.axis = 'none';
      normalizeScroll(el);
      finishPointerInteraction(drag.moved);
    },
    [normalizeScroll, finishPointerInteraction],
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || ignoreScrollHandlerRef.current) return;

    if (programmaticScrollSkipsRef.current > 0) {
      programmaticScrollSkipsRef.current -= 1;
      normalizeScroll(el);
      return;
    }

    dragMovedRef.current = true;
    dragStateRef.current.moved = true;
    userScrolledRef.current = true;
    setHoldPaused(true);
    setInteractionPaused(true);
    window.clearTimeout(scrollResumeTimerRef.current);
    if (!clickPausedRef.current) {
      scheduleAutoResume();
    }

    normalizeScroll(el);
  }, [normalizeScroll, scheduleAutoResume]);

  const handleCardSelect = useCallback(
    (index: number) => {
      window.clearTimeout(scrollResumeTimerRef.current);
      dragMovedRef.current = false;
      dragStateRef.current.moved = false;

      if (clickPaused && selectedIndex === index) {
        setClickPaused(false);
        setSelectedIndex(null);
        setInteractionPaused(false);
        setHoldPaused(false);
        return;
      }

      setClickPaused(true);
      setInteractionPaused(true);
      setHoldPaused(false);
      setIsDragging(false);
      setSelectedIndex(index);
    },
    [clickPaused, selectedIndex],
  );

  const loopItems = [...features, ...features];

  if (reducedMotion) {
    return <FeatureCardGrid />;
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-slate-50/95 to-transparent dark:from-slate-950/95 sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-slate-50/95 to-transparent dark:from-slate-950/95 sm:w-16"
        aria-hidden
      />

      <div
        ref={scrollRef}
        className="overflow-x-auto py-1 scrollbar-hide overscroll-x-contain select-none [-webkit-overflow-scrolling:touch]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onScroll={handleScroll}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="flex w-max items-stretch gap-4 sm:gap-5">
          {loopItems.map((feature, index) => (
            <FeatureCard
              key={`${feature.title}-${index}`}
              feature={feature}
              index={index}
              selected={selectedIndex === index % features.length && clickPaused}
              onSelect={handleCardSelect}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        {isPaused ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-[#0E1548] dark:text-blue-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            Duraklatıldı — kutuya tekrar dokunarak devam edin
          </span>
        ) : (
          'Parmağınızla kaydırın; kaydırınca akış durur, kutuya dokunarak sabitleyebilirsiniz'
        )}
      </p>
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
          <InfiniteFeatureMarquee />
        </div>
      </div>
    </section>
  );
}
