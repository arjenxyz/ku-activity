'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { HOME_DEMO_ASSETS } from '@/lib/home-demo-assets';
import { BrandLogo } from '@/components/home/BrandLogo';

const CARD_THEMES = [
  {
    gradient: 'linear-gradient(165deg, #9fd4f5 0%, #c5e8fb 45%, #e8f6fc 100%)',
    accent: '#38bdf8',
    ring: 'ring-sky-400',
    shadow: 'shadow-[0_22px_48px_rgba(56,189,248,0.28)]',
  },
  {
    gradient: 'linear-gradient(165deg, #fda4af 0%, #fecdd3 42%, #fff1f2 100%)',
    accent: '#fb7185',
    ring: 'ring-rose-400',
    shadow: 'shadow-[0_22px_48px_rgba(251,113,133,0.26)]',
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
    gradient: 'linear-gradient(165deg, #fdba74 0%, #fed7aa 42%, #fff7ed 100%)',
    accent: '#f97316',
    ring: 'ring-orange-400',
    shadow: 'shadow-[0_22px_48px_rgba(249,115,22,0.26)]',
  },
  {
    gradient: 'linear-gradient(165deg, #fcd34d 0%, #fde68a 42%, #fef9c3 100%)',
    accent: '#f59e0b',
    ring: 'ring-amber-400',
    shadow: 'shadow-[0_22px_48px_rgba(245,158,11,0.26)]',
  },
  {
    gradient: 'linear-gradient(165deg, #67e8f9 0%, #a5f3fc 42%, #ecfeff 100%)',
    accent: '#06b6d4',
    ring: 'ring-cyan-400',
    shadow: 'shadow-[0_22px_48px_rgba(6,182,212,0.26)]',
  },
  {
    gradient: 'linear-gradient(165deg, #c4b5fd 0%, #e9d5ff 50%, #faf5ff 100%)',
    accent: '#8b5cf6',
    ring: 'ring-purple-400',
    shadow: 'shadow-[0_22px_48px_rgba(139,92,246,0.26)]',
  },
] as const;

const AUTOPLAY_MS = 4800;
const MAX_PEEK = 2; // merkez + her iki yanda 2 = 5 kart görünür

type Story = {
  name: string;
  role: string;
  company: string;
};

type CardTheme = (typeof CARD_THEMES)[number];

function circularOffset(index: number, active: number, count: number): number {
  let diff = index - active;
  const half = Math.floor(count / 2);
  if (diff > half) diff -= count;
  if (diff < -half) diff += count;
  return diff;
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
          sizes={isActive ? '(max-width: 640px) 58vw, 240px' : '(max-width: 640px) 42vw, 180px'}
          priority={isActive}
        />
      </div>

      {isActive ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/35 via-black/10 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-[4.5rem] px-4 sm:px-5">
            <p className="text-[1.05rem] font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-[1.15rem]">
              {story.name}
            </p>
            <p className="mt-1 text-[0.75rem] font-medium leading-snug text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)] sm:text-[0.8125rem]">
              {story.role}
            </p>
          </div>
          <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-[0_4px_16px_rgba(15,23,42,0.08)] sm:inset-x-3 sm:bottom-3 sm:px-3.5 sm:py-2.5">
            <div className="min-w-0 flex-1">
              <BrandLogo name={story.company} size="story" />
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-slate-700 sm:text-[12px]">
              <span className="max-w-[5.5rem] truncate sm:max-w-none">{readStory}</span>
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full text-white sm:h-7 sm:w-7"
                style={{ backgroundColor: theme.accent }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
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

export function HomeStoriesSlider() {
  const strings = useRegistryStrings('components/home/HomeStoriesSlider');
  const stories = strings.stories as Story[];
  const reduceMotion = useReducedMotion() ?? false;
  const count = stories.length;
  const [active, setActive] = useState(() => Math.min(2, Math.max(0, count - 1)));
  const [peek, setPeek] = useState(MAX_PEEK);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setPeek(1);
      else if (w < 768) setPeek(2);
      else setPeek(MAX_PEEK);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const wrap = useCallback((index: number) => ((index % count) + count) % count, [count]);

  const jumpTo = useCallback(
    (index: number) => {
      setActive(wrap(index));
    },
    [wrap]
  );

  useEffect(() => {
    if (count <= 1 || isPaused) return undefined;
    const timer = window.setInterval(() => {
      setActive((prev) => wrap(prev + 1));
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, isPaused, wrap]);

  const visible = useMemo(() => {
    return stories
      .map((story, index) => ({
        story,
        index,
        offset: circularOffset(index, active, count),
      }))
      .filter((item) => Math.abs(item.offset) <= peek)
      .sort((a, b) => a.offset - b.offset);
  }, [stories, active, count, peek]);

  const cardWidth = peek <= 1 ? 200 : 172;
  const gap = peek <= 1 ? 14 : 16;
  const step = cardWidth + gap;

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
          <div className="pointer-events-none absolute inset-y-2 left-0 z-30 hidden w-12 bg-gradient-to-r from-[#eef6fb] via-[#eef6fb]/85 to-transparent sm:block lg:w-20" />
          <div className="pointer-events-none absolute inset-y-2 right-0 z-30 hidden w-12 bg-gradient-to-l from-[#eef6fb] via-[#eef6fb]/85 to-transparent sm:block lg:w-20" />

          <div
            className="relative mx-auto h-[340px] w-full sm:h-[380px] lg:h-[420px]"
            style={{ maxWidth: step * (peek * 2 + 1) + 80 }}
          >
            {visible.map(({ story, index, offset }) => {
              const isActive = offset === 0;
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const image =
                HOME_DEMO_ASSETS.storyImages[index % HOME_DEMO_ASSETS.storyImages.length];
              const width = isActive ? cardWidth + 36 : cardWidth;
              const scale = isActive ? 1 : reduceMotion ? 0.92 : 0.88;
              const y = isActive ? 0 : reduceMotion ? 0 : 12;

              return (
                <motion.button
                  key={story.name + index}
                  type="button"
                  onClick={() => jumpTo(index)}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`${story.name}, ${story.role}`}
                  className="absolute bottom-0 left-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                  style={{ width }}
                  initial={false}
                  animate={{
                    x: offset * step - width / 2,
                    scale,
                    y,
                    zIndex: isActive ? 40 : 20 - Math.abs(offset),
                    opacity: 1,
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0.2 }
                      : { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 }
                  }
                  whileTap={{ scale: scale * 0.98 }}
                >
                  <StoryCardFace
                    story={story}
                    image={image}
                    theme={theme}
                    isActive={isActive}
                    readStory={strings.readStory}
                  />
                </motion.button>
              );
            })}
          </div>

          {count > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label={strings.title}>
              {stories.map((story, index) => {
                const isCurrent = index === active;
                return (
                  <button
                    key={`${story.name}-dot-${index}`}
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
