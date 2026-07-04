'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowRight, FiBriefcase, FiSmartphone, FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { PLAY_STORE_ADMIN_ICON, PLAY_STORE_PERSONNEL_ICON } from '@/lib/play-store';
import strings from '@json/src/components/home/LoginRolePicker.json';

const panelStyles = {
  personel: {
    href: '/personnel-panel/login',
    icon: PLAY_STORE_PERSONNEL_ICON,
    Icon: FiSmartphone,
    accent: 'violet',
    gradient: 'from-violet-600/20 via-violet-500/5 to-transparent',
    ring: 'group-hover:ring-violet-400/40',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    arrow: 'text-violet-600 dark:text-violet-400',
    border: 'hover:border-violet-300 dark:hover:border-violet-600/50',
  },
  admin: {
    href: '/admin-panel/login',
    icon: PLAY_STORE_ADMIN_ICON,
    Icon: FiBriefcase,
    accent: 'blue',
    gradient: 'from-blue-600/20 via-cyan-500/5 to-transparent',
    ring: 'group-hover:ring-blue-400/40',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    arrow: 'text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-300 dark:hover:border-blue-600/50',
  },
} as const;

const loginPanels = (['personel', 'admin'] as const).map((id) => ({
  id,
  ...panelStyles[id],
  ...strings.panels[id],
}));

function LoginRoleCard({
  panel,
  index,
  onNavigate,
}: {
  panel: (typeof loginPanels)[number];
  index: number;
  onNavigate?: () => void;
}) {
  const PanelIcon = panel.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07, type: 'spring', damping: 24, stiffness: 320 }}
    >
      <Link
        href={panel.href}
        onClick={onNavigate}
        className={`group relative flex items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/8 active:scale-[0.99] dark:border-slate-700/80 dark:bg-slate-900/80 ${panel.border} ${panel.ring} hover:ring-2`}
      >
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${panel.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
          aria-hidden
        />

        <div className="relative flex shrink-0 flex-col items-center gap-2">
          <span className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-md ring-2 ring-white dark:ring-slate-800">
            <Image src={panel.icon} alt="" width={56} height={56} className="h-full w-full object-cover" />
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${panel.badge}`}
          >
            <PanelIcon className="h-3 w-3" aria-hidden />
            {panel.subtitle}
          </span>
        </div>

        <div className="relative min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{panel.title}</p>
              <p className="mt-1 text-sm leading-snug text-slate-500 dark:text-slate-400">{panel.description}</p>
            </div>
            <span
              className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700 ${panel.arrow}`}
            >
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {panel.features.map((f) => (
              <span
                key={f}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function LoginRolePickerPanel({ onNavigate }: { onNavigate?: () => void; compact?: boolean }) {
  return (
    <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
      {loginPanels.map((panel, i) => (
        <LoginRoleCard key={panel.id} panel={panel} index={i} onNavigate={onNavigate} />
      ))}
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
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#0E1548]/70 backdrop-blur-md"
            aria-label={strings.closeOverlayAriaLabel}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-role-modal-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-slate-50 shadow-2xl shadow-[#0E1548]/30 sm:rounded-3xl dark:border-slate-700 dark:bg-slate-950"
          >
            {/* Header */}
            <div className="relative overflow-hidden px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0E1548] via-blue-900 to-indigo-800"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BrandMark size="md" className="ring-2 ring-white/20" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-blue-200/90">{APP_NAME}</p>
                    <h2 id="login-role-modal-title" className="text-lg font-bold text-white sm:text-xl">
                      {strings.modalTitle}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/90 transition-colors hover:bg-white/20"
                  aria-label={strings.closeButtonAriaLabel}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed text-blue-100/90">
                {strings.modalSubtitle}
              </p>
              <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            <LoginRolePickerPanel onNavigate={onClose} />

            <p className="border-t border-slate-200/80 px-5 py-3 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
              {strings.footerNote}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const buttonStyles = {
  hero: [
    'touch-target relative inline-flex items-center justify-center gap-2.5 overflow-hidden',
    'rounded-2xl px-8 py-4 text-base font-semibold text-white',
    'bg-gradient-to-r from-[#0E1548] via-blue-700 to-indigo-600',
    'shadow-xl shadow-blue-900/25 ring-1 ring-white/10',
    'transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/35 hover:brightness-110',
    'active:scale-[0.98] w-full sm:w-auto',
  ].join(' '),
  header: [
    'inline-flex items-center gap-2 overflow-hidden rounded-xl',
    'bg-gradient-to-r from-[#0E1548] to-blue-700 px-4 py-2.5',
    'text-sm font-semibold text-white',
    'shadow-md shadow-blue-900/20 ring-1 ring-white/10',
    'transition-all duration-300 hover:shadow-lg hover:brightness-110',
  ].join(' '),
  mobile: [
    'touch-target flex w-full items-center justify-center gap-2 overflow-hidden',
    'rounded-2xl px-4 py-3.5 text-sm font-semibold text-white',
    'bg-gradient-to-r from-[#0E1548] to-blue-700',
    'shadow-lg shadow-blue-900/25 ring-1 ring-white/10',
  ].join(' '),
} as const;

function LoginButtonShimmer() {
  return (
    <span
      className="pointer-events-none absolute inset-0 animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent"
      aria-hidden
    />
  );
}

export function LoginRoleButton({
  className,
  variant = 'hero',
  children = strings.buttonDefault,
  showIcon = true,
}: {
  className?: string;
  variant?: keyof typeof buttonStyles;
  children?: ReactNode;
  showIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const style = variant === 'hero' && className ? className : buttonStyles[variant];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={style}>
        <LoginButtonShimmer />
        <span className="relative flex items-center gap-2">
          {children}
          {showIcon && (
            <svg className="h-4 w-4 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          )}
        </span>
      </button>
      <LoginRoleModal open={open} onClose={close} />
    </>
  );
}
