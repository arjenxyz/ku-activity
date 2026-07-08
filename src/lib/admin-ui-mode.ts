import type { ProjectMenuLink } from '@/config/projectMenu';
import strings from '@json/src/lib/admin-ui-mode.json';

export type AdminUiMode = 'simple' | 'advanced';

export const ADMIN_UI_MODE_STORAGE_KEY = 'crewledger-admin-ui-mode';

export const ADMIN_UI_MODE_LABELS = strings.modeLabels as Record<AdminUiMode, string>;

export function readAdminUiMode(): AdminUiMode {
  if (typeof window === 'undefined') return 'simple';
  const stored = localStorage.getItem(ADMIN_UI_MODE_STORAGE_KEY);
  return stored === 'advanced' ? 'advanced' : 'simple';
}

export function writeAdminUiMode(mode: AdminUiMode) {
  localStorage.setItem(ADMIN_UI_MODE_STORAGE_KEY, mode);
}

/** Basit modda günlük ihtiyaç menüsü */
export function getSimpleMenuLinks(projectId: string): ProjectMenuLink[] {
  const id = projectId;
  return [
    {
      label: strings.simpleMenu.summary.label,
      href: () => `/admin-panel/proje/${id}`,
      hint: strings.simpleMenu.summary.hint,
    },
    {
      label: strings.simpleMenu.approval.label,
      href: () => `/admin-panel/proje/${id}/basvuru-onay`,
      hint: strings.simpleMenu.approval.hint,
    },
    {
      label: strings.simpleMenu.attendance.label,
      href: () => `/admin-panel/proje/${id}/yevmiye`,
      hint: strings.simpleMenu.attendance.hint,
    },
  ];
}

const SIMPLE_PROJECT_SUFFIXES = [
  '',
  '/yevmiye',
  '/basvuru-onay',
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
