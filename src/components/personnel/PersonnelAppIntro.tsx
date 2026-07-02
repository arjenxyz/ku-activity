'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  PERSONNEL_INTRO_SPLASH_BG,
  PERSONNEL_INTRO_STORAGE_KEY,
} from '@/lib/personnel-intro-splash';

const INTRO_STORAGE_KEY = PERSONNEL_INTRO_STORAGE_KEY;
const PHASE1_MS = 1400;
const PHASE2_MS = 2400;
const EXIT_MS = 420;

type Props = {
  onComplete: () => void;
};

function IntroLogoPhase() {
  return (
    <motion.div
      key="logo"
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: PERSONNEL_INTRO_SPLASH_BG }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.08 }}
        className="rounded-full bg-blue-600/40 p-3 ring-1 ring-white/20"
      >
        <BrandMark
          size="lg"
          className="!h-24 !w-24 !rounded-full shadow-2xl shadow-blue-900/40 ring-4 ring-white/15"
        />
      </motion.div>
    </motion.div>
  );
}

function IntroHeroPhase() {
  return (
    <motion.div
      key="hero"
      className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-8 top-[18%] h-24 w-56 rounded-full bg-white/35 blur-2xl" />
        <div className="absolute right-0 top-[28%] h-28 w-64 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-[22%] left-[10%] h-20 w-72 rounded-full bg-white/25 blur-2xl" />
      </div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-[18%] flex justify-center"
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.15 }}
      >
        <svg
          viewBox="0 0 420 220"
          className="h-44 w-[min(92vw,24rem)] text-white/90 drop-shadow-lg"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M40 190h340v12H40zM120 190V92h18v98h-18zm140 0V110h16v80h-16zm60 0V70h14v120h-14zM90 190l70-118 14 8-70 110z"
            opacity="0.92"
          />
          <path
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            d="M300 190V40M300 40l48-18M300 40l-12 52"
            opacity="0.95"
          />
          <rect x="286" y="52" width="28" height="10" rx="2" fill="currentColor" opacity="0.9" />
        </svg>
      </motion.div>

      <div className="relative flex h-full flex-col items-center justify-between px-6 pb-10 pt-14 safe-pt safe-pb">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white/75"
        >
          CrewLedger Personel
        </motion.p>

        <div className="flex flex-col items-center gap-5">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="max-w-xs text-center text-2xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-md"
          >
            Şantiyede güvenle ilerle
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.45 }}
            className="flex items-center gap-2.5"
          >
            {['Yoklama', 'Yevmiye', 'Bordro'].map((label) => (
              <span
                key={label}
                className="rounded-full border border-amber-200/50 bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm"
              >
                {label}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.45 }}
          className="flex flex-col items-center gap-2"
        >
          <BrandMark size="lg" className="!h-14 !w-14 !rounded-2xl ring-2 ring-white/30 shadow-xl" />
          <span className="text-sm font-bold tracking-[0.12em] text-white">CREWLEDGER</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function PersonnelAppIntro({ onComplete }: Props) {
  const [phase, setPhase] = useState<1 | 2>(1);
  const [fading, setFading] = useState(false);

  const finish = useCallback(() => {
    if (fading) return;
    setFading(true);
    window.setTimeout(onComplete, EXIT_MS);
  }, [fading, onComplete]);

  useEffect(() => {
    const toHero = window.setTimeout(() => setPhase(2), PHASE1_MS);
    const toExit = window.setTimeout(() => finish(), PHASE1_MS + PHASE2_MS);
    return () => {
      window.clearTimeout(toHero);
      window.clearTimeout(toExit);
    };
  }, [finish]);

  return (
    <motion.button
      type="button"
      className="fixed inset-0 z-[100] sm:hidden cursor-default"
      aria-label="Açılış ekranı — geçmek için dokunun"
      onClick={finish}
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: EXIT_MS / 1000 }}
    >
      <AnimatePresence mode="wait">
        {phase === 1 ? <IntroLogoPhase /> : <IntroHeroPhase />}
      </AnimatePresence>
    </motion.button>
  );
}

export function markPersonnelIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function hasSeenPersonnelIntro() {
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export { INTRO_STORAGE_KEY };
