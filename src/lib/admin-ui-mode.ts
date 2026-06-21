import type { ProjectMenuLink } from '@/config/projectMenu';

export type AdminUiMode = 'simple' | 'advanced';

export const ADMIN_UI_MODE_STORAGE_KEY = 'crewledger-admin-ui-mode';

export const ADMIN_UI_MODE_LABELS: Record<AdminUiMode, string> = {
  simple: 'Basit',
  advanced: 'Gelişmiş',
};

export function readAdminUiMode(): AdminUiMode {
  if (typeof window === 'undefined') return 'simple';
  const stored = localStorage.getItem(ADMIN_UI_MODE_STORAGE_KEY);
  return stored === 'advanced' ? 'advanced' : 'simple';
}

export function writeAdminUiMode(mode: AdminUiMode) {
  localStorage.setItem(ADMIN_UI_MODE_STORAGE_KEY, mode);
}

/** Basit modda günlük işlem menüsü */
export function getSimpleMenuLinks(projectId: string): ProjectMenuLink[] {
  const id = projectId;
  return [
    {
      label: 'Yoklama',
      href: () => `/admin-panel/proje/${id}/yevmiye`,
      hint: 'QR ile günlük yoklama',
    },
    {
      label: 'Avans',
      href: () => `/admin-panel/proje/${id}/avans`,
      hint: 'Avans ekleme',
    },
    {
      label: 'Personel itirazları',
      href: () => `/admin-panel/proje/${id}/itirazlar`,
      hint: 'Yevmiye itirazları',
    },
  ];
}

const SIMPLE_PROJECT_SUFFIXES = [
  '/yevmiye',
  '/avans',
  '/itirazlar',
] as const;

/** Basit modda erişilebilir proje sayfaları */
export function isSimpleModeProjectPath(projectId: string, pathname: string): boolean {
  const base = `/admin-panel/proje/${projectId}`;
  if (!pathname.startsWith(base)) return false;
  const suffix = pathname === base ? '' : pathname.slice(base.length).split('?')[0] ?? '';
  return SIMPLE_PROJECT_SUFFIXES.some((allowed) => suffix === allowed);
}

/** Basit modda erişilebilir genel admin sayfaları */
export function isSimpleModeGlobalPath(pathname: string): boolean {
  return pathname === '/admin-panel' || pathname.startsWith('/admin-panel/login');
}

export function isPathAllowedInSimpleMode(projectId: string | null, pathname: string): boolean {
  if (isSimpleModeGlobalPath(pathname)) return true;
  if (!projectId) return false;
  return isSimpleModeProjectPath(projectId, pathname);
}
