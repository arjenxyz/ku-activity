'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';

const heroApps = [
  {
    id: 'personel',
    badge: 'Personel',
    title: 'Personel Uygulaması',
    subtitle: 'Yoklama, yevmiye, mesai',
    description: 'Sahada günlük işlemler: QR yoklama, bordro görüntüleme ve başvuru.',
    features: ['QR Yoklama', 'Bordro', 'Başvuru'],
    playUrl: PLAY_STORE_PERSONNEL_URL,
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/30',
    ring: 'ring-blue-400/40',
    chipBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800',
    panelBorder: 'border-blue-200/80 dark:border-blue-700/60',
    panelBg: 'from-blue-50/90 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40',
  },
  {
    id: 'admin',
    badge: 'Yönetici',
    title: 'Yönetici Uygulaması',
    subtitle: 'Proje, onay, raporlar',
    description: 'Şantiye operasyonu: proje yönetimi, personel onayı ve raporlar.',
    features: ['Proje', 'Onay', 'Raporlar'],
    playUrl: PLAY_STORE_ADMIN_URL,
    gradient: 'from-slate-600 to-slate-900',
    glow: 'shadow-slate-500/25',
    ring: 'ring-slate-400/35',
    chipBg: 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    panelBorder: 'border-slate-200/80 dark:border-slate-600/50',
    panelBg: 'from-slate-50/90 via-white to-slate-100/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950',
  },
] as const;

function AppChoicePanel({
  app,
  selected,
  onSelect,
}: {
  app: (typeof heroApps)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const hasPlayLink = Boolean(app.playUrl);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex h-full w-full flex-col rounded-2xl border-2 bg-gradient-to-br p-5 text-left transition-all xl:p-6 ${
        selected
          ? `${app.panelBorder} ${app.ring} ring-4 shadow-xl`
          : 'border-slate-200/80 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
      } ${app.panelBg}`}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${app.gradient} text-white shadow-lg ${app.glow} transition-transform group-hover:scale-105`}
        >
          <Image src="/crewledger.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${app.chipBg}`}
          >
            {app.badge}
          </span>
          <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{app.title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{app.subtitle}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{app.description}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {app.features.map((feature) => (
          <li
            key={feature}
            className="inline-flex items-center rounded-full border border-slate-200/80 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {feature}
          </li>
        ))}
      </ul>

      <div
        className="mt-auto pt-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} />
      </div>
    </button>
  );
}

function PlayStoreChoiceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="play-store-choice-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-label="Kapat"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-4xl"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-700/80 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-md dark:border-slate-600 dark:bg-slate-800">
                    <GooglePlayIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 id="play-store-choice-title" className="text-lg font-bold text-slate-900 dark:text-white">
                      Uygulamanızı seçin
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Personel veya yönetici sürümünü indirin
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                  aria-label="Kapat"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6">
                {heroApps.map((app) => (
                  <AppChoicePanel
                    key={app.id}
                    app={app}
                    selected={selectedId === app.id}
                    onSelect={() => setSelectedId(app.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function HeroPlayStorePromo() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <motion.div
        className="relative hidden lg:block"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/20 via-blue-500/15 to-indigo-500/20 blur-2xl" />

        <button
          type="button"
          onClick={openModal}
          className="group relative w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 text-left shadow-2xl shadow-blue-900/10 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-emerald-500/15 dark:border-slate-700/80 dark:bg-slate-900/75 dark:shadow-black/40"
        >
          <Image
            src="/banner.png"
            alt="Google Play'den CrewLedger uygulamasını indirin"
            width={749}
            height={208}
            className="block h-auto w-full"
            sizes="(min-width: 1024px) 50vw"
            priority
          />

          <div className="p-6 xl:p-7">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Android için CrewLedger mobil uygulaması. Personel ve yönetici sürümlerinden birini seçerek
              Google Play&apos;den indirebilirsiniz.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex -space-x-2">
                {heroApps.map((app) => (
                  <div
                    key={app.id}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient} ring-2 ring-white dark:ring-slate-900`}
                  >
                    <Image src="/crewledger.png" alt="" width={24} height={24} className="h-6 w-6 rounded-md" />
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">2 uygulama · Ücretsiz</span>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:bg-slate-800 group-hover:shadow-xl dark:bg-white dark:text-slate-900 dark:group-hover:bg-slate-100">
              <GooglePlayIcon className="h-5 w-5" />
              Uygulama seç
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            <div className="mt-5 flex items-center gap-4 border-t border-slate-200/70 pt-4 text-xs text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                Güvenli giriş
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Anında erişim
              </span>
            </div>
          </div>
        </button>
      </motion.div>

      <PlayStoreChoiceModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
