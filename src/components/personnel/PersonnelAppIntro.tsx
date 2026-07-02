'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PERSONNEL_INTRO_IMAGE, PERSONNEL_PWA_SPLASH_BG } from '@/lib/personnel-pwa-brand';

const DISPLAY_MS = 3400;
const EXIT_MS = 480;
const MIN_LOAD_MS = 1200;

type Props = {
  onComplete: () => void;
};

function IntroLoadingFooter() {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pt-20"
      style={{
        paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))',
        background:
          'linear-gradient(to top, rgba(6,13,20,0.97) 0%, rgba(6,13,20,0.72) 45%, transparent 100%)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.55, ease: 'easeOut' }}
    >
      <motion.p
        className="mb-4 text-center text-[15px] font-medium tracking-wide text-white/90"
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        Uygulama hazırlanıyor…
      </motion.p>

      <div className="relative mx-auto h-1 w-[min(72vw,220px)] overflow-hidden rounded-full bg-white/12">
        <motion.div
          className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-gradient-to-r from-sky-500/20 via-sky-400 to-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.55)]"
          animate={{ x: ['-120%', '320%'] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-sky-400"
            animate={{
              opacity: [0.25, 1, 0.25],
              scale: [0.75, 1.15, 0.75],
              y: [0, -3, 0],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.16,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function PersonnelAppIntro({ onComplete }: Props) {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [readyAt, setReadyAt] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!imageReady || readyAt !== null) return;
    setReadyAt(Date.now());
  }, [imageReady, readyAt]);

  const finish = useCallback(() => {
    if (fading) return;
    setFading(true);
    window.setTimeout(onComplete, EXIT_MS);
  }, [fading, onComplete]);

  useEffect(() => {
    if (!readyAt) return;

    const elapsed = Date.now() - readyAt;
    const wait = Math.max(DISPLAY_MS - elapsed, MIN_LOAD_MS);
    const toExit = window.setTimeout(() => finish(), wait);
    return () => window.clearTimeout(toExit);
  }, [readyAt, finish]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      role="presentation"
      aria-busy="true"
      aria-label="Uygulama hazırlanıyor"
      className="fixed inset-0 z-[9999] h-[100dvh] w-full max-sm:block sm:hidden touch-none overflow-hidden"
      style={{ backgroundColor: PERSONNEL_PWA_SPLASH_BG }}
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: EXIT_MS / 1000 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={PERSONNEL_INTRO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          onLoad={() => setImageReady(true)}
        />
      </motion.div>

      <IntroLoadingFooter />
    </motion.div>,
    document.body
  );
}
