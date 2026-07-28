'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowRight, FiX } from 'react-icons/fi';
import { APP_NAME } from '@/lib/brand';
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

const demoMeta = {
  personel: {
    href: '/personnel-panel/demo',
    icon: PLAY_STORE_PERSONNEL_ICON,
  },
  admin: {
    href: '/admin-panel/demo',
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

function useDemoPanels() {
  const strings = useRegistryStrings('components/home/LoginRolePicker');
  return useMemo(
    () =>
      (['personel', 'admin'] as const).map((id) => ({
        id: `demo-${id}`,
        ...demoMeta[id],
        ...strings.demos[id],
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
  return (
    <Link
      href={panel.href}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/80 dark:active:bg-slate-800"
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700">
        <Image src={panel.icon} alt="" width={36} height={36} className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{panel.title}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{panel.description}</span>
      </span>
      <FiArrowRight
        className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
        aria-hidden
      />
    </Link>
  );
}

export function LoginRolePickerPanel({ onNavigate }: { onNavigate?: () => void; compact?: boolean }) {
  const loginPanels = useLoginPanels();
  const demoPanels = useDemoPanels();
  const strings = useRegistryStrings('components/home/LoginRolePicker');
  return (
    <div className="px-2 pb-2 pt-1">
      {loginPanels.map((panel) => (
        <LoginRoleRow key={panel.id} panel={panel} onNavigate={onNavigate} />
      ))}
      <div className="mx-3 my-2 border-t border-slate-100 dark:border-slate-800" />
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
        {strings.demoHeading}
      </p>
      {demoPanels.map((panel) => (
        <LoginRoleRow key={panel.id} panel={panel} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function LoginRoleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const strings = useRegistryStrings('components/home/LoginRolePicker');
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
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
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label={strings.closeOverlayAriaLabel}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-role-modal-title"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[20rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {APP_NAME}
                </p>
                <h2
                  id="login-role-modal-title"
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {strings.modalTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={strings.closeButtonAriaLabel}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <LoginRolePickerPanel onNavigate={onClose} />

            <p className="border-t border-slate-100 px-3.5 py-2 text-center text-[10px] leading-snug text-slate-400 dark:border-slate-800 dark:text-slate-500">
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
    'bg-[#0E1548]',
    'shadow-lg shadow-[#0E1548]/20',
    'transition-colors duration-200 hover:bg-[#152060]',
    'active:scale-[0.98] w-full sm:w-auto',
  ].join(' '),
  header: [
    'inline-flex items-center gap-2 overflow-hidden rounded-xl',
    'bg-[#0E1548] px-4 py-2.5',
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
