'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchPersonnelUnlockContext } from '@/lib/personnel-session-check';
import { loadPendingRegistration } from '@/lib/registration-pending-storage';
import {
  PERSONNEL_INTRO_ACCENT,
  PERSONNEL_INTRO_BG,
  PERSONNEL_INTRO_GLOW,
  PERSONNEL_INTRO_GRADIENT,
} from '@/lib/personnel-pwa-brand';
import { APP_NAME, APP_TAGLINE_TR, PERSONNEL_APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';

/** İntro en az bu kadar görünür — oturum kontrolü daha hızlı bitse bile. */
const MIN_INTRO_MS = 1500;

/**
 * TWA/PWA açılış merkezi + marka introsu. Oturum durumuna göre tek seferde
 * doğru ekrana yönlendirir; bu sırada profesyonel bir açılış animasyonu gösterir.
 */
export default function PersonnelLaunchPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const startedAt = Date.now();

    const resolveTarget = async (): Promise<string> => {
      try {
        const ctx = await fetchPersonnelUnlockContext();
        if (ctx?.unlocked) return '/personnel-panel';
        if (ctx) return '/personnel-panel/unlock';
        if (loadPendingRegistration()) return '/personnel-panel/basvuru';
      } catch {
        /* ağ hatası — girişe düş */
      }
      return '/personnel-panel/login';
    };

    void resolveTarget().then((target) => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_INTRO_MS - (Date.now() - startedAt));
      // SPA yönlendirmesi: tam sayfa reload yapmaz → TWA'da "web ekranı açılıp kapandı" flash'ı olmaz.
      timer = window.setTimeout(() => {
        if (!cancelled) router.replace(target);
      }, wait);
    });

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-8"
      style={{ background: PERSONNEL_INTRO_GRADIENT, backgroundColor: PERSONNEL_INTRO_BG }}
      role="status"
      aria-live="polite"
      aria-label={`${APP_NAME} — ${APP_TAGLINE_TR}`}
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative"
          initial={{ scale: 0.82, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-[30px] blur-2xl"
            style={{ background: PERSONNEL_INTRO_GLOW }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${PERSONNEL_APP_ICON}?v=${PWA_ASSET_VERSION}`}
            alt={APP_NAME}
            width={112}
            height={112}
            className="h-28 w-28 rounded-[26px] shadow-2xl shadow-black/40 ring-1 ring-white/10"
          />
        </motion.div>

        <motion.h1
          className="mt-6 text-2xl font-bold tracking-tight text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          {APP_NAME}
        </motion.h1>
        <motion.p
          className="mt-1.5 text-sm font-medium text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          {APP_TAGLINE_TR}
        </motion.p>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="relative h-1 w-[min(64vw,180px)] overflow-hidden rounded-full bg-white/10">
          <motion.span
            className="absolute inset-y-0 left-0 w-2/5 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${PERSONNEL_INTRO_ACCENT}, transparent)`,
            }}
            animate={{ x: ['-120%', '320%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}
