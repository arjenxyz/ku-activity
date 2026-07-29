'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { HOME_DEMO_ASSETS } from '@/lib/home-demo-assets';
import { BrandLogo } from '@/components/home/BrandLogo';

/** Referans: yumuşak pastel kart arka planları */
const CARD_BACKGROUNDS = ['#e9dfd3', '#d9e8f3', '#d8eedf', '#e6dcf3', '#f0eacd'] as const;

const AUTOPLAY_MS = 5500;
const SLOT_SPRING = { type: 'spring' as const, stiffness: 340, damping: 34, mass: 0.82 };

type Story = {
  name: string;
  role: string;
  company: string;
};

function slotMotion(offset: number, reduceMotion: boolean) {
  const abs = Math.abs(offset);
  const configs: Record<number, { scale: number; opacity: number; y: number }> = {
    0: { scale: 1, opacity: 1, y: 0 },
    1: { scale: 0.84, opacity: 0.82, y: 14 },
    2: { scale: 0.7, opacity: 0.62, y: 26 },
  };
  const cfg = configs[abs] ?? configs[2];

  if (reduceMotion) {
    return {
      scale: offset === 0 ? 1 : 0.9,
      opacity: offset === 0 ? 1 : 0.65,
      y: offset === 0 ? 0 : 8,
      zIndex: offset === 0 ? 20 : 12 - abs,
    };
  }

  return {
    scale: cfg.scale,
    opacity: cfg.opacity,
    y: cfg.y,
    zIndex: offset === 0 ? 20 : 12 - abs,
  };
}

function StoryCardFace({
  story,
  image,
  background,
  isActive,
  readStory,
}: {
  story: Story;
  image: string;
  background: string;
  isActive: boolean;
  readStory: string;
}) {
  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden rounded-[1.35rem] transition-shadow ${
        isActive
          ? 'shadow-[0_18px_40px_rgba(16,185,129,0.18)] ring-2 ring-emerald-400'
          : 'shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
      }`}
      style={{ backgroundColor: background }}
    >
      <Image
        src={image}
        alt=""
        fill
        className="object-cover object-top"
        sizes={isActive ? '260px' : '200px'}
        priority={isActive}
      />

      {isActive ? (
        <>
          <div className="absolute inset-x-0 bottom-[4.35rem] bg-gradient-to-t from-black/45 via-black/10 to-transparent px-5 pb-3 pt-10">
            <p className="text-[1.05rem] font-bold leading-tight text-white sm:text-lg">{story.name}</p>
            <p className="mt-1 text-sm leading-snug text-white/90">{story.role}</p>
          </div>

          <div className="absolute inset-x-3.5 bottom-3.5 flex items-center justify-between gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm">
            <div className="min-w-0 flex-1">
              <BrandLogo name={story.company} size="story" />
            </div>
            <span className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-slate-700">
              {readStory}
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white"
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
  background,
  offset,
  direction,
  readStory,
  reduceMotion,
  onSelect,
}: {
  storyIndex: number;
  story: Story;
  image: string;
  background: string;
  offset: number;
  direction: number;
  readStory: string;
  reduceMotion: boolean;
  onSelect: () => void;
}) {
  const isActive = offset === 0;
  const slideDistance = reduceMotion ? 0 : 48;

  return (
    <motion.div
      className="relative w-[min(42vw,168px)] shrink-0 sm:w-[190px] lg:w-[220px]"
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
            transition={{ duration: reduceMotion ? 0.2 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <StoryCardFace
              story={story}
              image={image}
              background={background}
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
  const [visibleSlots, setVisibleSlots] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const count = stories.length;

  useEffect(() => {
    const lg = window.matchMedia('(min-width: 1024px)');
    const sm = window.matchMedia('(min-width: 640px)');

    const update = () => {
      if (lg.matches) setVisibleSlots(5);
      else if (sm.matches) setVisibleSlots(3);
      else setVisibleSlots(1);
    };

    update();
    lg.addEventListener('change', update);
    sm.addEventListener('change', update);
    return () => {
      lg.removeEventListener('change', update);
      sm.removeEventListener('change', update);
    };
  }, []);

  const wrap = useCallback((index: number) => ((index % count) + count) % count, [count]);

  const offsets = useMemo(() => {
    if (count <= 1) return [0];
    if (visibleSlots === 1) return [0];
    if (visibleSlots === 3) return [-1, 0, 1];
    return [-2, -1, 0, 1, 2];
  }, [count, visibleSlots]);

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
    <section className="overflow-hidden bg-white py-12 sm:py-16" aria-label={strings.title}>
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
          <div className="pointer-events-none absolute inset-y-6 left-0 z-30 hidden w-20 bg-gradient-to-r from-white via-white/80 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-6 right-0 z-30 hidden w-20 bg-gradient-to-l from-white via-white/80 to-transparent lg:block" />

          <div className="flex items-end justify-center gap-2 sm:gap-3 lg:gap-4">
            {offsets.map((offset) => {
              const storyIndex = wrap(active + offset);
              const story = stories[storyIndex];

              return (
                <StorySlot
                  key={visibleSlots === 1 ? 'mobile' : `slot-${offset}`}
                  storyIndex={storyIndex}
                  story={story}
                  image={HOME_DEMO_ASSETS.storyImages[storyIndex % HOME_DEMO_ASSETS.storyImages.length]}
                  background={CARD_BACKGROUNDS[storyIndex % CARD_BACKGROUNDS.length]}
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
        </div>
      </div>
    </section>
  );
}
