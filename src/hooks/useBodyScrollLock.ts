'use client';

import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;
let previousBody: {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
} | null = null;
let previousHtmlOverflow = '';

function preventBackgroundScroll(event: Event) {
  const target = event.target;
  if (target instanceof Element && target.closest('[data-scroll-lock-allow]')) return;
  event.preventDefault();
}

function lockDocument() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousBody = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
    document.addEventListener('wheel', preventBackgroundScroll, { passive: false });
  }
  lockCount += 1;
}

function unlockDocument() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !previousBody) return;

  document.removeEventListener('touchmove', preventBackgroundScroll);
  document.removeEventListener('wheel', preventBackgroundScroll);
  document.documentElement.style.overflow = previousHtmlOverflow;
  document.documentElement.style.scrollBehavior = 'auto';
  document.body.style.position = previousBody.position;
  document.body.style.top = previousBody.top;
  document.body.style.left = previousBody.left;
  document.body.style.right = previousBody.right;
  document.body.style.width = previousBody.width;
  document.body.style.overflow = previousBody.overflow;
  previousBody = null;
  window.scrollTo(0, savedScrollY);
  requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = '';
  });
}

/** Keeps the page still while a menu or modal is open. Nested locks stay closed until the last one releases. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockDocument();
    return () => unlockDocument();
  }, [locked]);
}
