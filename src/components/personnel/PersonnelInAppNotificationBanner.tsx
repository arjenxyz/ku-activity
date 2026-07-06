'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { usePersonnelNotificationsContext } from '@/contexts/PersonnelNotificationsContext';
import { PERSONNEL_APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';

const AUTO_DISMISS_MS = 5000;

export function PersonnelInAppNotificationBanner() {
  const { toast, dismissToast, openPanel } = usePersonnelNotificationsContext();
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [-120, 0], [0, 1]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => dismissToast(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -48 || info.velocity.y < -400) {
      dismissToast();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[var(--personnel-notify-z)] flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <motion.button
        type="button"
        drag="y"
        dragConstraints={{ top: -160, bottom: 0 }}
        dragElastic={0.12}
        style={{ y: dragY, opacity }}
        onDragEnd={handleDragEnd}
        onClick={() => openPanel()}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -24, opacity: 0 }}
        className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3 text-left shadow-lg backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95"
      >
        <img
          src={`${PERSONNEL_APP_ICON}?v=${PWA_ASSET_VERSION}`}
          alt=""
          className="h-10 w-10 shrink-0 rounded-xl object-cover"
          draggable={false}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
            {toast.title}
          </span>
          <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {toast.body}
          </span>
        </span>
      </motion.button>
    </div>
  );
}
