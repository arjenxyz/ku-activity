'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { HOME_DEMO_ASSETS } from '@/lib/home-demo-assets';
import { BrandLogo } from '@/components/home/BrandLogo';

/** Kolay İK tarzı canlı pastel kart gradyanları */
const CARD_THEMES = [
  {
    gradient: 'linear-gradient(165deg, #9fd4f5 0%, #c5e8fb 45%, #e8f6fc 100%)',
    accent: '#38bdf8',
    ring: 'ring-sky-400',
    shadow: 'shadow-[0_18px_40px_rgba(56,189,248,0.26)]',
  },
  {
    gradient: 'linear-gradient(165deg, #86efac 0%, #bbf7d0 42%, #e8fceb 100%)',
    accent: '#22c55e',
    ring: 'ring-emerald-400',
    shadow: 'shadow-[0_18px_40px_rgba(34,197,94,0.26)]',
  },
  {
    gradient: 'linear-gradient(165deg, #c4b5fd 0%, #ddd6fe 42%, #f3e8ff 100%)',
    accent: '#a78bfa',
    ring: 'ring-violet-400',
    shadow: 'shadow-[0_18px_40px_rgba(167,139,250,0.26)]',
  },
  {
    gradient: 'linear-gradient(165deg, #fcd34d 0%, #fde68a 42%, #fef9c3 100%)',
    accent: '#f59e0b',
    ring: 'ring-amber-400',
    shadow: 'shadow-[0_18px_40px_rgba(245,158,11,0.24)]',
  },
  {
    gradient: 'linear-gradient(165deg, #fda4af 0%, #fecdd3 42%, #fff1f2 100%)',
    accent: '#fb7185',
    ring: 'ring-rose-400',
    shadow: 'shadow-[0_18px_40px_rgba(251,113,133,0.24)]',
  },
] as const;

const AUTOPLAY_MS = 5500;

type Story = {
  name: string;
  role: string;
  company: string;
};

type CardTheme = (typeof CARD_THEMES)[number];

function StoryCard({
  story,
  image,
  theme,
  isActive,
  readStory,
  onSelect,
  reduceMotion,
}: {
  story: Story;
  image: string;
  theme: CardTheme;
  isActive: boolean;
  readStory: string;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`${story.name}, ${story.role}`}
      className="block w-[min(42vw,148px)] shrink-0 snap-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 sm:w-[156px] md:w-[168px] lg:w-[180px]"
      animate={{
        scale: isActive ? 1 : reduceMotion ? 0.96 : 0.92,
        y: isActive || reduceMotion ? 0 : 8,
        zIndex: isActive ? 20 : 10,
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.75 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`relative aspect-[3/4] overflow-hidden rounded-[1.15rem] transition-[box-shadow,ring-width] duration-300 ${
          isActive
            ? `ring-[2.5px] ${theme.ring} ${theme.shadow}`
            : 'shadow-[0_10px_24px_rgba(15,23,42,0.08)] ring-0'
        }`}
        style={{ background: theme.gradient }}
      >
        <div className="absolute inset-0">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover object-[center_18%]"
            sizes="(max-width: 640px) 42vw, 180px"
            priority={isActive}
          />
        </div>

        {isActive ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/40 via-black/12 to-transparent"
              aria-hidden
            />

            <div className="absolute inset-x-0 bottom-[4.1rem] px-3 sm:bottom-[4.35rem] sm:px-3.5">
              <p className="text-[0.95rem] font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-[1.05rem]">
                {story.name}
              </p>
              <p className="mt-0.5 text-[0.7rem] font-medium leading-snug text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)] sm:text-[0.75rem]">
                {story.role}
              </p>
            </div>

            <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-xl bg-white px-2 py-1.5 shadow-[0_4px_14px_rgba(15,23,42,0.08)] sm:inset-x-2.5 sm:bottom-2.5 sm:gap-2 sm:px-2.5 sm:py-2">
              <div className="min-w-0 flex-1">
                <BrandLogo name={story.company} size="story" />
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-slate-700 sm:gap-1.5 sm:text-[11px]">
                <span className="max-w-[4.5rem] truncate sm:max-w-none">{readStory}</span>
                <span
                  aria-hidden
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: theme.accent }}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
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
    </motion.button>
  );
}

export function HomeStoriesSlider() {
  const strings = useRegistryStrings('components/home/HomeStoriesSlider');
  const stories = strings.stories;
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(Math.min(2, Math.max(0, stories.length - 1)));
  const [isPaused, setIsPaused] = useState(false);
  const count = stories.length;

  const jumpTo = useCallback((index: number) => {
    setActive(((index % count) + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || isPaused) return undefined;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, isPaused]);

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
          {/* Tüm kartlar aynı satırda — 3’lü peek yok */}
          <div className="-mx-4 flex items-end justify-start gap-2.5 overflow-x-auto px-4 pb-2 pt-4 [scrollbar-width:none] snap-x snap-mandatory sm:mx-0 sm:justify-center sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-6 lg:gap-3.5 [&::-webkit-scrollbar]:hidden">
            {stories.map((story: Story, index: number) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const image =
                HOME_DEMO_ASSETS.storyImages[index % HOME_DEMO_ASSETS.storyImages.length];

              return (
                <StoryCard
                  key={`${story.name}-${index}`}
                  story={story}
                  image={image}
                  theme={theme}
                  isActive={index === active}
                  readStory={strings.readStory}
                  onSelect={() => jumpTo(index)}
                  reduceMotion={reduceMotion ?? false}
                />
              );
            })}
          </div>

          {count > 1 ? (
            <div className="mt-7 flex items-center justify-center gap-2" role="tablist" aria-label={strings.title}>
              {stories.map((story: Story, index: number) => {
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
