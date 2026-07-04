'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ADMIN_INTRO_IMAGE, ADMIN_PWA_SPLASH_BG } from '@/lib/admin-pwa-brand';
import strings from '@json/src/components/admin/AdminAppIntro.json';

const DISPLAY_MS = 3200;
const EXIT_MS = 480;
const MIN_LOAD_MS = 1400;

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
          'linear-gradient(to top, rgba(15,23,42,0.97) 0%, rgba(15,23,42,0.72) 45%, transparent 100%)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: 'easeOut' }}
    >
      <motion.p
        className="mb-4 text-center text-[15px] font-medium tracking-wide text-white/90"
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {strings.loadingText}
      </motion.p>

      <div className="relative mx-auto h-1 w-[min(72vw,220px)] overflow-hidden rounded-full bg-white/12">
        <motion.div
          className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-gradient-to-r from-indigo-500/20 via-indigo-400 to-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.55)]"
          animate={{ x: ['-120%', '320%'] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-indigo-400"
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

export function AdminAppIntro({ onComplete }: Props) {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.getElementById('cl-admin-intro-boot')?.remove();
  }, []);

  const finish = useCallback(() => {
    if (fading) return;
    setFading(true);
    window.setTimeout(onComplete, EXIT_MS);
  }, [fading, onComplete]);

  useEffect(() => {
    if (!mounted) return;
    const toExit = window.setTimeout(() => finish(), Math.max(DISPLAY_MS, MIN_LOAD_MS));
    return () => window.clearTimeout(toExit);
  }, [mounted, finish]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      role="presentation"
      aria-busy="true"
      aria-label={strings.ariaLabel}
      className="fixed inset-0 z-[9999] h-[100dvh] w-full max-sm:block sm:hidden touch-none overflow-hidden"
      style={{ backgroundColor: ADMIN_PWA_SPLASH_BG }}
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: EXIT_MS / 1000 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ADMIN_INTRO_IMAGE}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-center"
        />
      </motion.div>

      <IntroLoadingFooter />
    </motion.div>,
    document.body
  );
}
