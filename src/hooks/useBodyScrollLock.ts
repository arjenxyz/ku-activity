'use client';

import { useEffect } from 'react';

/** Overlay içindeki kaydırılabilir alanlara ekleyin: data-allow-scroll */
export const ALLOW_SCROLL_ATTR = 'data-allow-scroll';

type SavedStyles = {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
  paddingRight: string;
};

type LockState = {
  count: number;
  scrollY: number;
  body: SavedStyles;
  htmlOverflow: string;
};

let lockState: LockState | null = null;
let touchStartY = 0;

function getAllowScrollEl(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest(`[${ALLOW_SCROLL_ATTR}]`);
}

function canScroll(el: HTMLElement, deltaY: number): boolean {
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight <= clientHeight + 1) return false;
  if (deltaY < 0) return scrollTop > 0;
  if (deltaY > 0) return scrollTop + clientHeight < scrollHeight - 1;
  return true;
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]?.clientY ?? 0;
}

function onTouchMove(e: TouchEvent) {
  const scrollEl = getAllowScrollEl(e.target);
  if (!scrollEl) {
    e.preventDefault();
    return;
  }
  const y = e.touches[0]?.clientY ?? 0;
  const deltaY = touchStartY - y;
  if (!canScroll(scrollEl, deltaY)) {
    e.preventDefault();
  }
}

function onWheel(e: WheelEvent) {
  const scrollEl = getAllowScrollEl(e.target);
  if (!scrollEl) {
    e.preventDefault();
    return;
  }
  if (!canScroll(scrollEl, e.deltaY)) {
    e.preventDefault();
  }
}

function applyDocumentLock() {
  const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
  const scrollY = window.scrollY;

  lockState = {
    count: 1,
    scrollY,
    body: {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    },
    htmlOverflow: document.documentElement.style.overflow,
  };

  document.documentElement.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  if (scrollbarGap > 0) {
    document.body.style.paddingRight = `${scrollbarGap}px`;
  }

  document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  document.addEventListener('wheel', onWheel, { passive: false, capture: true });
}

function releaseDocumentLock() {
  if (!lockState) return;
  const { scrollY, body, htmlOverflow } = lockState;

  document.documentElement.style.overflow = htmlOverflow;
  document.body.style.position = body.position;
  document.body.style.top = body.top;
  document.body.style.left = body.left;
  document.body.style.right = body.right;
  document.body.style.width = body.width;
  document.body.style.overflow = body.overflow;
  document.body.style.paddingRight = body.paddingRight;

  document.removeEventListener('touchstart', onTouchStart, true);
  document.removeEventListener('touchmove', onTouchMove, true);
  document.removeEventListener('wheel', onWheel, true);

  lockState = null;
  window.scrollTo(0, scrollY);
}

/**
 * Overlay (modal / drawer / sheet) açıkken arka plan kaydırmasını kilitler.
 * İç scroll için elemente `data-allow-scroll` ekleyin.
 * İç içe overlay’lerde sayaç kullanır.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    if (!lockState) {
      applyDocumentLock();
    } else {
      lockState.count += 1;
    }

    return () => {
      if (!lockState) return;
      lockState.count -= 1;
      if (lockState.count <= 0) {
        releaseDocumentLock();
      }
    };
  }, [locked]);
}
