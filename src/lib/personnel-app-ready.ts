'use client';

let personnelUiReady = false;

export const PERSONNEL_UI_READY_EVENT = 'crewledger-personnel-ui-ready';

export function markPersonnelUiReady() {
  if (typeof window === 'undefined') return;
  if (personnelUiReady) return;
  personnelUiReady = true;
  window.dispatchEvent(new CustomEvent(PERSONNEL_UI_READY_EVENT));
}

export function isPersonnelUiReady() {
  return personnelUiReady;
}

/** Intro / boot overlay bittikten sonra — bildirim izni burada istenir */
export function whenPersonnelUiReady(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  if (personnelUiReady) {
    callback();
    return () => undefined;
  }
  const handler = () => callback();
  window.addEventListener(PERSONNEL_UI_READY_EVENT, handler, { once: true });
  return () => window.removeEventListener(PERSONNEL_UI_READY_EVENT, handler);
}
