'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { SupportChatPanel } from '@/components/support/SupportChatPanel';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const HIDDEN_PREFIXES = ['/personnel-panel', '/admin-panel', '/developer-panel', '/auth'];
const FAB_SIZE = 56;
const FAB_MARGIN = 16;
const FAB_STORAGE_KEY = 'support-fab-position-v1';
const LONG_PRESS_MS = 280;

type FabPosition = { x: number; y: number };

function clampFab(pos: FabPosition): FabPosition {
  if (typeof window === 'undefined') return pos;
  const maxX = Math.max(FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN);
  const maxY = Math.max(FAB_MARGIN, window.innerHeight - FAB_SIZE - FAB_MARGIN);
  return {
    x: Math.min(Math.max(pos.x, FAB_MARGIN), maxX),
    y: Math.min(Math.max(pos.y, FAB_MARGIN), maxY),
  };
}

function defaultFabPosition(): FabPosition {
  if (typeof window === 'undefined') return { x: FAB_MARGIN, y: FAB_MARGIN };
  return clampFab({
    x: window.innerWidth - FAB_SIZE - FAB_MARGIN,
    y: window.innerHeight - FAB_SIZE - Math.max(FAB_MARGIN, 16),
  });
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const strings = useRegistryStrings('components/support/HomeSupportFab');
  const [open, setOpen] = useState(false);
  const [fabPos, setFabPos] = useState<FabPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const positionStartRef = useRef<FabPosition | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);
  const dragReadyRef = useRef(false);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  useBodyScrollLock(open && typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fromStorage = (() => {
      try {
        const raw = window.localStorage.getItem(FAB_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<FabPosition>;
        if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
        return clampFab({ x: parsed.x, y: parsed.y });
      } catch {
        return null;
      }
    })();

    setFabPos(fromStorage ?? defaultFabPosition());
  }, []);

  useEffect(() => {
    if (!fabPos) return;
    try {
      window.localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(fabPos));
    } catch {
      // no-op: storage may be unavailable
    }
  }, [fabPos]);

  useEffect(() => {
    const onResize = () => {
      setFabPos((current) => {
        if (!current) return defaultFabPosition();
        return clampFab(current);
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(
    () => () => {
      if (!longPressTimerRef.current) return;
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    },
    []
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (!open) return undefined;
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (hidden) return null;

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (open || !fabPos) return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    positionStartRef.current = fabPos;
    dragReadyRef.current = false;
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      dragReadyRef.current = true;
      setDragging(true);
      suppressClickRef.current = true;
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = pointerStartRef.current;
    const base = positionStartRef.current;
    if (!start || !base) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const moved = Math.abs(dx) > 6 || Math.abs(dy) > 6;
    if (moved) suppressClickRef.current = true;
    if (!dragReadyRef.current) return;
    setFabPos(clampFab({ x: base.x + dx, y: base.y + dy }));
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
    pointerStartRef.current = null;
    positionStartRef.current = null;
    dragReadyRef.current = false;
    if (dragging) {
      setDragging(false);
      return;
    }
    if (!suppressClickRef.current) {
      setOpen((value) => !value);
    }
    suppressClickRef.current = false;
  };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="support-chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="screen-report-ignore pointer-events-auto fixed inset-0 z-[56] flex flex-col sm:inset-auto sm:bottom-[calc(3.5rem+1.25rem+0.75rem)] sm:right-5 sm:h-auto sm:w-[min(calc(100vw-2.5rem),400px)] sm:p-0"
          >
            <SupportChatPanel onClose={() => setOpen(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-0 z-[55]">
        <div
          className="pointer-events-auto absolute"
          style={{
            left: fabPos?.x ?? FAB_MARGIN,
            top: fabPos?.y ?? FAB_MARGIN,
          }}
        >
          <motion.button
            type="button"
            aria-label={open ? strings.ariaLabelClose : strings.ariaLabelOpen}
            aria-expanded={open}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className={`relative flex h-14 w-14 touch-none items-center justify-center overflow-hidden rounded-full shadow-[0_8px_24px_rgba(14,21,72,0.22)] transition active:scale-[0.98] ${
              open ? 'hidden sm:flex bg-[#0E1548]' : 'bg-transparent'
            } ${dragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-[1.03]'}`}
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
                  className="flex h-full w-full items-center justify-center text-white"
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
                  className="flex h-full w-full"
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
    </>
  );
}
