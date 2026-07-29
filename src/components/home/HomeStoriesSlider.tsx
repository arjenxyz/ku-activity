'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { HOME_DEMO_ASSETS } from '@/lib/home-demo-assets';
import { BrandLogo } from '@/components/home/BrandLogo';

/** Kolay İK tarzı canlı pastel kart gradyanları */
const CARD_THEMES = [
  {
    gradient: 'linear-gradient(165deg, #9fd4f5 0%, #c5e8fb 45%, #e8f6fc 100%)',
    accent: '#38bdf8',
    ring: 'ring-sky-400',
    shadow: 'shadow-[0_22px_48px_rgba(56,189,248,0.28)]',
  },
  {
    gradient: 'linear-gradient(165deg, #86efac 0%, #bbf7d0 42%, #e8fceb 100%)',
    accent: '#22c55e',
    ring: 'ring-emerald-400',
    shadow: 'shadow-[0_22px_48px_rgba(34,197,94,0.28)]',
  },
  {
    gradient: 'linear-gradient(165deg, #c4b5fd 0%, #ddd6fe 42%, #f3e8ff 100%)',
    accent: '#a78bfa',
    ring: 'ring-violet-400',
    shadow: 'shadow-[0_22px_48px_rgba(167,139,250,0.28)]',
  },
  {
    gradient: 'linear-gradient(165deg, #fcd34d 0%, #fde68a 42%, #fef9c3 100%)',
    accent: '#f59e0b',
    ring: 'ring-amber-400',
    shadow: 'shadow-[0_22px_48px_rgba(245,158,11,0.26)]',
  },
  {
    gradient: 'linear-gradient(165deg, #fda4af 0%, #fecdd3 42%, #fff1f2 100%)',
    accent: '#fb7185',
    ring: 'ring-rose-400',
    shadow: 'shadow-[0_22px_48px_rgba(251,113,133,0.26)]',
  },
] as const;

const AUTOPLAY_MS = 5500;
const SLOT_SPRING = { type: 'spring' as const, stiffness: 380, damping: 36, mass: 0.78 };

type Story = {
  name: string;
  role: string;
  company: string;
};

type CardTheme = (typeof CARD_THEMES)[number];

function slotMotion(offset: number, reduceMotion: boolean) {
  const abs = Math.abs(offset);

  if (reduceMotion) {
    return {
      scale: offset === 0 ? 1 : 0.9,
      opacity: offset === 0 ? 1 : 0.72,
      y: 0,
      zIndex: offset === 0 ? 30 : 14 - abs,
    };
  }

  const configs: Record<number, { scale: number; opacity: number; y: number }> = {
    0: { scale: 1, opacity: 1, y: 0 },
    1: { scale: 0.88, opacity: 0.92, y: 10 },
  };
  const cfg = configs[abs] ?? configs[1];

  return {
    scale: cfg.scale,
    opacity: cfg.opacity,
    y: cfg.y,
    zIndex: offset === 0 ? 30 : 14 - abs,
  };
}

function StoryCardFace({
  story,
  image,
  theme,
  isActive,
  readStory,
}: {
  story: Story;
  image: string;
  theme: CardTheme;
  isActive: boolean;
  readStory: string;
}) {
  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden rounded-[1.25rem] transition-[box-shadow,ring-width] duration-300 ${
        isActive
          ? `ring-[2.5px] ${theme.ring} ${theme.shadow}`
          : 'shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-0'
      }`}
      style={{ background: theme.gradient }}
    >
      <div className="absolute inset-0">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover object-[center_18%]"
          sizes={isActive ? '(max-width: 640px) 72vw, 280px' : '(max-width: 640px) 56vw, 220px'}
          priority={isActive}
        />
      </div>

      {/* Soft vignette so white name text stays readable without a heavy dark bar */}
      {isActive ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/35 via-black/10 to-transparent"
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-[4.75rem] px-5 sm:px-6">
            <p className="text-[1.125rem] font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-[1.2rem]">
              {story.name}
            </p>
            <p className="mt-1 text-[0.8125rem] font-medium leading-snug text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)] sm:text-sm">
              {story.role}
            </p>
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_4px_16px_rgba(15,23,42,0.08)] sm:inset-x-3.5 sm:bottom-3.5 sm:px-4 sm:py-3">
            <div className="min-w-0 flex-1">
              <BrandLogo name={story.company} size="story" />
            </div>
            <span className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-slate-700">
              {readStory}
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: theme.accent }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StorySlot({
  storyIndex,
  story,
  image,
  theme,
  offset,
  direction,
  readStory,
  reduceMotion,
  onSelect,
}: {
  storyIndex: number;
  story: Story;
  image: string;
  theme: CardTheme;
  offset: number;
  direction: number;
  readStory: string;
  reduceMotion: boolean;
  onSelect: () => void;
}) {
  const isActive = offset === 0;
  const slideDistance = reduceMotion ? 0 : 56;

  return (
    <motion.div
      className={`relative shrink-0 ${
        isActive
          ? 'w-[min(72vw,260px)] sm:w-[240px] lg:w-[280px]'
          : 'w-[min(56vw,200px)] sm:w-[200px] lg:w-[230px]'
      }`}
      animate={slotMotion(offset, reduceMotion)}
      transition={SLOT_SPRING}
    >
      <motion.button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`${story.name}, ${story.role}`}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        whileTap={{ scale: 0.985 }}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={storyIndex}
            custom={direction}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction * slideDistance, scale: 0.96 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction * -slideDistance, scale: 0.96 }
            }
            transition={{ duration: reduceMotion ? 0.2 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <StoryCardFace
              story={story}
              image={image}
              theme={theme}
              isActive={isActive}
              readStory={readStory}
            />
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

export function HomeStoriesSlider() {
  const strings = useRegistryStrings('components/home/HomeStoriesSlider');
  const stories = strings.stories;
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(2);
  const [direction, setDirection] = useState(1);
  const [peekSides, setPeekSides] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const count = stories.length;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 480px)');
    const update = () => setPeekSides(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const wrap = useCallback((index: number) => ((index % count) + count) % count, [count]);

  const offsets = useMemo(() => {
    if (count <= 1) return [0];
    if (!peekSides) return [0];
    return [-1, 0, 1];
  }, [count, peekSides]);

  const go = useCallback(
    (delta: number) => {
      if (delta === 0) return;
      setDirection(delta > 0 ? 1 : -1);
      setActive((prev) => wrap(prev + delta));
    },
    [wrap]
  );

  const jumpTo = useCallback(
    (index: number) => {
      setDirection(index > active ? 1 : index < active ? -1 : 0);
      setActive(wrap(index));
    },
    [active, wrap]
  );

  useEffect(() => {
    if (count <= 1 || isPaused) return undefined;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, go, isPaused]);

  return (
    <section
      className="overflow-hidden bg-gradient-to-b from-[#eef6fb] via-[#f5fafc] to-white py-14 sm:py-16 lg:py-20"
      aria-label={strings.title}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsPaused(false);
            }
          }}
        >
          <div className="pointer-events-none absolute inset-y-4 left-0 z-30 hidden w-16 bg-gradient-to-r from-[#eef6fb] via-[#eef6fb]/80 to-transparent sm:block lg:w-24" />
          <div className="pointer-events-none absolute inset-y-4 right-0 z-30 hidden w-16 bg-gradient-to-l from-[#eef6fb] via-[#eef6fb]/80 to-transparent sm:block lg:w-24" />

          <div className="flex items-end justify-center gap-3 sm:gap-4 lg:gap-5">
            {offsets.map((offset) => {
              const storyIndex = wrap(active + offset);
              const story = stories[storyIndex];
              const theme = CARD_THEMES[storyIndex % CARD_THEMES.length];

              return (
                <StorySlot
                  key={peekSides ? `slot-${offset}` : 'mobile'}
                  storyIndex={storyIndex}
                  story={story}
                  image={HOME_DEMO_ASSETS.storyImages[storyIndex % HOME_DEMO_ASSETS.storyImages.length]}
                  theme={theme}
                  offset={offset}
                  direction={direction}
                  readStory={strings.readStory}
                  reduceMotion={reduceMotion ?? false}
                  onSelect={() => {
                    if (offset < 0) go(-1);
                    else if (offset > 0) go(1);
                    else jumpTo(storyIndex);
                  }}
                />
              );
            })}
          </div>

          {count > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label={strings.title}>
              {stories.map((story, index) => {
                const isCurrent = index === active;
                return (
                  <button
                    key={`${story.name}-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={story.name}
                    onClick={() => jumpTo(index)}
                    className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
                      isCurrent ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-300/80 hover:bg-slate-400'
                    }`}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
