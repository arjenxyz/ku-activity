'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { SupportChatPanel } from '@/components/support/SupportChatPanel';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const HIDDEN_PREFIXES = ['/personnel-panel', '/admin-panel', '/developer-panel', '/auth'];

export function SupportChatWidget() {
  const pathname = usePathname();
  const strings = useRegistryStrings('components/support/HomeSupportFab');
  const [open, setOpen] = useState(false);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  useBodyScrollLock(open && typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (!open) return undefined;
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
      <div className="pointer-events-auto relative flex flex-col items-end gap-3">
        <AnimatePresence>
          {open ? (
            <motion.div
              key="support-chat-panel"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-[min(calc(100vw-2rem),380px)]"
            >
              <SupportChatPanel onClose={() => setOpen(false)} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? strings.ariaLabelClose : strings.ariaLabelOpen}
          aria-expanded={open}
          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(14,21,72,0.22)] ring-1 ring-slate-200/80 transition hover:scale-[1.03] active:scale-[0.98]"
          whileTap={{ scale: 0.96 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex h-full w-full items-center justify-center bg-[#0E1548] text-white"
              >
                <FiX className="h-6 w-6" aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <Image
                  src="/ai-destek.png"
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  priority
                />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
