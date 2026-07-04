/** Yönetici intro — oturum başına bir kez */
export const ADMIN_INTRO_STORAGE_KEY = 'cl-admin-intro-v1';

export function hasSeenAdminIntro(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markAdminIntroSeen(): void {
  try {
    sessionStorage.setItem(ADMIN_INTRO_STORAGE_KEY, '1');
  } catch {
    /* private mode */
  }
}
