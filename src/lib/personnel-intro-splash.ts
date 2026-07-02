/** Intro logo fazı (bg-blue-700) — PWA/TWA splash ile aynı renk */
export const PERSONNEL_INTRO_SPLASH_BG = '#1d4ed8';

/** Intro hero fazı başlangıç (sky-400) — standalone köprü rengi */
export const PERSONNEL_INTRO_HERO_BG = '#38bdf8';

/** localStorage: cihazda bir kez (PWA her açılışta tekrar etmesin) */
export const PERSONNEL_INTRO_STORAGE_KEY = 'cl-personnel-intro-v2';

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function hasSeenPersonnelIntro(): boolean {
  try {
    return localStorage.getItem(PERSONNEL_INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPersonnelIntroSeen(): void {
  try {
    localStorage.setItem(PERSONNEL_INTRO_STORAGE_KEY, '1');
  } catch {
    /* private mode */
  }
}
