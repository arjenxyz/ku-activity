/** Personel intro — oturum başına bir kez */
export const PERSONNEL_INTRO_STORAGE_KEY = 'cl-personnel-intro-v4';

export function hasSeenPersonnelIntro(): boolean {
  try {
    return sessionStorage.getItem(PERSONNEL_INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPersonnelIntroSeen(): void {
  try {
    sessionStorage.setItem(PERSONNEL_INTRO_STORAGE_KEY, '1');
  } catch {
    /* private mode */
  }
}
