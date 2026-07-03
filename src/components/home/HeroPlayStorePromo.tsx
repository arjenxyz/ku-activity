'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  PLAY_STORE_ADMIN_ICON,
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_PERSONNEL_ICON,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';
import { GooglePlayBadge, GooglePlayIcon } from '@/components/home/GooglePlayBadge';

const heroApps = [
  {
    id: 'personel',
    title: 'Personel Uygulaması',
    subtitle: 'Yoklama, yevmiye, mesai',
    description: 'Sahada günlük işlemler: QR yoklama, bordro görüntüleme ve başvuru.',
    features: ['QR Yoklama', 'Bordro', 'Başvuru'],
    playUrl: PLAY_STORE_PERSONNEL_URL,
    iconSrc: PLAY_STORE_PERSONNEL_ICON,
    panelBorder: 'border-violet-200/80 dark:border-violet-800/50',
    panelBg: 'bg-gradient-to-br from-violet-50/95 via-white to-indigo-50/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-indigo-950/20',
    iconRing: 'ring-violet-200/90 dark:ring-violet-800/60',
    featureChip: 'border-violet-100 bg-white/90 text-violet-800/90 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'admin',
    title: 'Yönetici Uygulaması',
    subtitle: 'Proje, onay, raporlar',
    description: 'Şantiye operasyonu: proje yönetimi, personel onayı ve raporlar.',
    features: ['Proje', 'Onay', 'Raporlar'],
    playUrl: PLAY_STORE_ADMIN_URL,
    iconSrc: PLAY_STORE_ADMIN_ICON,
    panelBorder: 'border-teal-200/80 dark:border-teal-800/50',
    panelBg: 'bg-gradient-to-br from-teal-50/95 via-white to-emerald-50/45 dark:from-teal-950/25 dark:via-slate-900 dark:to-emerald-950/15',
    iconRing: 'ring-teal-200/90 dark:ring-teal-800/60',
    featureChip: 'border-teal-100 bg-white/90 text-teal-800/90 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200',
    accent: 'text-teal-600 dark:text-teal-400',
  },
] as const;

function ModalCardsConnector() {
  return (
    <div className="hidden items-stretch justify-center px-1 lg:flex" aria-hidden>
      <div className="w-px self-stretch bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-slate-700" />
    </div>
  );
}

function AppChoiceCard({
  app,
  index,
}: {
  app: (typeof heroApps)[number];
  index: number;
}) {
  const hasPlayLink = Boolean(app.playUrl);

  return (
    <motion.article
      className={`flex h-full flex-col rounded-2xl border p-5 xl:p-6 ${app.panelBorder} ${app.panelBg} shadow-sm transition-shadow hover:shadow-md`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm ring-2 ${app.iconRing} xl:h-16 xl:w-16 xl:rounded-2xl`}
        >
          <Image
            src={app.iconSrc}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold ${app.accent}`}>Android · Ücretsiz</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{app.title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{app.subtitle}</p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{app.description}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {app.features.map((feature) => (
          <li
            key={feature}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${app.featureChip}`}
          >
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-slate-200/70 pt-5 dark:border-slate-700/60">
        <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} fullWidth />
      </div>
    </motion.article>
  );
}

function PlayStoreChoiceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
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

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] hidden items-center justify-center p-6 lg:flex xl:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="play-store-choice-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#0E1548]/50 backdrop-blur-sm"
            aria-label="Kapat"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-4xl"
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-[#0E1548]/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
              <div
                className="h-1 bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
                aria-hidden
              />

              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 shadow-sm dark:border-slate-600 dark:bg-slate-800">
                    <GooglePlayIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 id="play-store-choice-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Uygulamanızı seçin
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Personel veya yönetici sürümünü indirin
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                  aria-label="Kapat"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0 px-6 pb-6">
                <AppChoiceCard app={heroApps[0]} index={0} />
                <ModalCardsConnector />
                <AppChoiceCard app={heroApps[1]} index={1} />
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
        <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-400/15 via-blue-500/10 to-teal-400/15 blur-2xl" />

        <button
          type="button"
          onClick={openModal}
          className="group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-xl shadow-[#0E1548]/5 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-900/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30"
        >
          <div
            className="h-1 bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
            aria-hidden
          />

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
                    className="h-10 w-10 overflow-hidden rounded-xl ring-2 ring-white dark:ring-slate-900"
                  >
                    <Image
                      src={app.iconSrc}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">2 uygulama · Ücretsiz</span>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0E1548] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:bg-[#151d5c] group-hover:shadow-xl">
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
