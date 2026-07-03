'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { PLAY_STORE_ADMIN_ICON, PLAY_STORE_PERSONNEL_ICON } from '@/lib/play-store';

const loginPanels = [
  {
    id: 'personel',
    href: '/personnel-panel/login',
    title: 'Personel Paneli',
    headline: 'Sahadayım',
    description: 'Yoklama, yevmiye ve bordro görüntüleme',
    icon: PLAY_STORE_PERSONNEL_ICON,
    cardClass:
      'border-violet-200/80 bg-gradient-to-br from-violet-50/95 via-white to-indigo-50/60 hover:border-violet-300 hover:shadow-md dark:border-violet-900/50 dark:from-violet-950/35 dark:via-slate-900 dark:to-indigo-950/25 dark:hover:border-violet-700',
    titleClass: 'text-slate-900 dark:text-white',
    descClass: 'text-slate-500 dark:text-slate-400',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  },
  {
    id: 'admin',
    href: '/admin-panel/login',
    title: 'Yönetici Paneli',
    headline: 'Yönetiyorum',
    description: 'Proje, personel onayı ve raporlar',
    icon: PLAY_STORE_ADMIN_ICON,
    cardClass:
      'border-blue-200/80 bg-gradient-to-br from-blue-50/95 via-white to-indigo-50/60 hover:border-blue-300 hover:shadow-md dark:border-blue-900/50 dark:from-blue-950/35 dark:via-slate-900 dark:to-indigo-950/25 dark:hover:border-blue-700',
    titleClass: 'text-slate-900 dark:text-white',
    descClass: 'text-slate-500 dark:text-slate-400',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
] as const;

export function LoginRolePickerPanel({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4 p-4 sm:p-5 pt-0 sm:pt-0'}>
      {!compact && (
        <div
          className="h-1 rounded-full bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
          aria-hidden
        />
      )}

      <div className={compact ? 'px-1' : ''}>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          Hangi yetki ile giriş yapmak istiyorsunuz?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Personel ve yönetici panelleri ayrı giriş ekranlarına yönlendirir.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {loginPanels.map((panel) => (
          <Link
            key={panel.id}
            href={panel.href}
            onClick={onNavigate}
            className={`group flex flex-col rounded-xl border p-3 transition-all active:scale-[0.98] sm:p-3.5 ${panel.cardClass}`}
          >
            <span
              className={`mb-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${panel.badgeClass}`}
            >
              {panel.headline}
            </span>
            <span className="relative mx-auto mb-2 h-11 w-11 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5">
              <Image src={panel.icon} alt="" width={44} height={44} className="h-full w-full object-cover" />
            </span>
            <span className={`text-center text-sm font-bold leading-tight ${panel.titleClass}`}>{panel.title}</span>
            <span className={`mt-1 text-center text-[11px] leading-snug ${panel.descClass}`}>{panel.description}</span>
            <span className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400">
              Devam et
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LoginRoleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Giriş menüsünü kapat"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-role-modal-title"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Kapat"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p id="login-role-modal-title" className="sr-only">
              Hangi yetki ile giriş yapmak istiyorsunuz?
            </p>
            <LoginRolePickerPanel onNavigate={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LoginRoleButton({
  className,
  children = 'Giriş Yap',
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <LoginRoleModal open={open} onClose={close} />
    </>
  );
}
