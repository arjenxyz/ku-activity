'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowRight, FiX } from 'react-icons/fi';
import { APP_NAME } from '@/lib/brand';
import { PERSONNEL_DEMO_BASE } from '@/lib/demo/demo-paths';
import { PLAY_STORE_ADMIN_ICON, PLAY_STORE_PERSONNEL_ICON } from '@/lib/play-store';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const panelMeta = {
  personel: {
    href: '/personnel-panel/login',
    icon: PLAY_STORE_PERSONNEL_ICON,
  },
  admin: {
    href: '/admin-panel/login',
    icon: PLAY_STORE_ADMIN_ICON,
  },
} as const;

function useLoginPanels() {
  const strings = useRegistryStrings('components/home/LoginRolePicker');
  return useMemo(
    () =>
      (['personel', 'admin'] as const).map((id) => ({
        id,
        ...panelMeta[id],
        ...strings.panels[id],
      })),
    [strings]
  );
}

function LoginRoleRow({
  panel,
  onNavigate,
}: {
  panel: { href: string; icon: string; title: string; description: string; id: string };
  onNavigate?: () => void;
}) {
  const isAdmin = panel.id === 'admin';

  return (
    <Link
      href={panel.href}
      onClick={onNavigate}
      className={[
        'group flex items-center gap-3.5 rounded-2xl border bg-white px-3.5 py-3 shadow-sm transition-all',
        'active:scale-[0.99] dark:bg-slate-900',
        isAdmin
          ? 'border-slate-200/90 hover:border-teal-200 hover:bg-teal-50/70 hover:shadow-md hover:shadow-teal-900/5 dark:border-slate-700 dark:hover:border-teal-800 dark:hover:bg-teal-950/30'
          : 'border-slate-200/90 hover:border-blue-200 hover:bg-[#f4f8ff] hover:shadow-md hover:shadow-[#2D6AF6]/10 dark:border-slate-700 dark:hover:border-blue-800 dark:hover:bg-blue-950/30',
      ].join(' ')}
    >
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[22%] shadow-md shadow-slate-900/15 ring-1 ring-black/5">
        <Image src={panel.icon} alt="" width={44} height={44} className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
          {panel.title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
          {panel.description}
        </span>
      </span>
      <span
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
          isAdmin
            ? 'bg-slate-100 text-slate-400 group-hover:bg-teal-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-500'
            : 'bg-slate-100 text-slate-400 group-hover:bg-[#0E1548] group-hover:text-white dark:bg-slate-800 dark:text-slate-500',
        ].join(' ')}
      >
        <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

export function LoginRolePickerPanel({ onNavigate }: { onNavigate?: () => void; compact?: boolean }) {
  const loginPanels = useLoginPanels();
  return (
    <div className="space-y-2.5 bg-gradient-to-b from-[#f7fbff] to-white px-4 py-4 dark:from-slate-900 dark:to-slate-900">
      {loginPanels.map((panel) => (
        <LoginRoleRow key={panel.id} panel={panel} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function LoginRoleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const strings = useRegistryStrings('components/home/LoginRolePicker');
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            aria-label={strings.closeOverlayAriaLabel}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-role-modal-title"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_24px_64px_rgba(14,21,72,0.28)] dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="relative overflow-hidden bg-[#0E1548] px-5 pb-4 pt-4 text-white">
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#2D6AF6]/45 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-8 bottom-0 h-16 w-24 rounded-full bg-sky-300/20 blur-2xl"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                    {APP_NAME}
                  </p>
                  <h2 id="login-role-modal-title" className="mt-1 text-lg font-semibold tracking-tight">
                    {strings.modalTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label={strings.closeButtonAriaLabel}
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>

            <LoginRolePickerPanel onNavigate={onClose} />

            <p className="border-t border-slate-100 px-5 py-3 text-center text-xs leading-snug text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {strings.footerNote}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

const buttonStyles = {
  hero: [
    'touch-target relative inline-flex items-center justify-center gap-2.5 overflow-hidden',
    'rounded-2xl px-8 py-4 text-base font-semibold text-white',
    'bg-[#0E1548]',
    'shadow-lg shadow-[#0E1548]/20',
    'transition-colors duration-200 hover:bg-[#152060]',
    'active:scale-[0.98] w-full sm:w-auto',
  ].join(' '),
  header: [
    'inline-flex items-center gap-2 overflow-hidden rounded-lg',
    'bg-[#0E1548] px-3.5 py-2',
    'text-sm font-semibold text-white',
    'shadow-sm',
    'transition-colors duration-200 hover:bg-[#152060]',
  ].join(' '),
  mobile: [
    'touch-target flex w-full items-center justify-center gap-2.5 overflow-hidden',
    'rounded-xl px-4 py-3.5 text-sm font-semibold text-white',
    'bg-[#0E1548]',
    'shadow-sm shadow-[#0E1548]/15',
    'transition-colors duration-200 hover:bg-[#152060]',
  ].join(' '),
} as const;

export function LoginRoleButton({
  className,
  variant = 'hero',
  children,
  showIcon = true,
}: {
  className?: string;
  variant?: keyof typeof buttonStyles;
  children?: ReactNode;
  showIcon?: boolean;
}) {
  const strings = useRegistryStrings('components/home/LoginRolePicker');
  const label = children ?? strings.buttonDefault;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const style = variant === 'hero' && className ? className : buttonStyles[variant];
  const iconFirst = variant === 'mobile';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={style}>
        <span className="relative flex items-center gap-2">
          {showIcon && iconFirst ? (
            <svg className="h-4 w-4 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          ) : null}
          {label}
          {showIcon && !iconFirst ? (
            <svg className="h-4 w-4 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          ) : null}
        </span>
      </button>
      <LoginRoleModal open={open} onClose={close} />
    </>
  );
}

const demoButtonStyles = [
  'touch-target inline-flex items-center justify-center gap-2',
  'rounded-xl border-2 border-gray-200 dark:border-slate-600',
  'px-8 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-200',
  'hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100 transition-colors',
  'w-full sm:w-auto',
].join(' ');

const heroPillButtonStyles = [
  'ebutton_outer touch-target relative inline-flex h-[51px] w-full min-w-[240px] max-w-[min(100%,20rem)] items-center overflow-hidden',
  'rounded-full bg-[#0E1548] pl-1.5 pr-5',
  'text-base font-semibold text-white',
  'shadow-md shadow-[#0E1548]/30 transition-[background-color,box-shadow,transform] duration-300',
  'hover:bg-[#152060] hover:shadow-lg hover:shadow-[#0E1548]/35',
  'active:scale-[0.98]',
].join(' ');

function HeroPillButtonContent({
  label,
  hoverLabel,
  hovered,
}: {
  label: string;
  hoverLabel: string;
  hovered: boolean;
}) {
  return (
    <>
      <motion.span
        aria-hidden={hovered}
        initial={false}
        animate={{ opacity: hovered ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none relative z-[1] flex w-full items-center justify-center pl-10 pr-3"
      >
        {label}
      </motion.span>

      <motion.span
        aria-hidden
        initial={false}
        animate={{ width: hovered ? 'calc(100% - 12px)' : undefined }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute left-1.5 top-1/2 z-10 flex h-10 -translate-y-1/2 items-center overflow-hidden rounded-full bg-white shadow-sm ${hovered ? '' : 'w-10'}`}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center text-[#0E1548]">
          <FiArrowRight className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <motion.span
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, maxWidth: hovered ? 280 : 0 }}
          transition={{ duration: 0.25, delay: hovered ? 0.12 : 0 }}
          className="overflow-hidden whitespace-nowrap pr-4 text-sm font-semibold text-[#0E1548]"
        >
          {hoverLabel}
        </motion.span>
      </motion.span>

      <span className="sr-only">{hovered ? hoverLabel : label}</span>
    </>
  );
}

/** Hero CTA — doğrudan personel demosuna gider. */
export function DemoRoleButton({
  className,
  children,
  pill = false,
}: {
  className?: string;
  children?: string;
  pill?: boolean;
}) {
  const hero = useRegistryStrings('components/home/HeroSection');
  const label = children ?? hero.ctaDemo;
  const hoverLabel = hero.ctaDemoHover ?? 'Demoyu hemen başlatın';
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={PERSONNEL_DEMO_BASE}
      prefetch
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={pill ? heroPillButtonStyles : className ?? demoButtonStyles}
      aria-label={hovered ? hoverLabel : label}
    >
      {pill ? (
        <HeroPillButtonContent label={label} hoverLabel={hoverLabel} hovered={hovered} />
      ) : (
        label
      )}
    </Link>
  );
}
