/** Personel paneli girişsiz demo prefix. */
export const PERSONNEL_DEMO_BASE = '/personnel-panel/demo';

/** Admin paneli girişsiz demo prefix. */
export const ADMIN_DEMO_BASE = '/admin-panel/demo';

export const DEMO_PROJECT_ID = 'demo-project';

export function isPersonnelDemoPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === PERSONNEL_DEMO_BASE || pathname.startsWith(`${PERSONNEL_DEMO_BASE}/`);
}

export function isAdminDemoPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === ADMIN_DEMO_BASE || pathname.startsWith(`${ADMIN_DEMO_BASE}/`);
}

/** Client-side: window pathname’e göre personel demosu. */
export function isPersonnelDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return isPersonnelDemoPath(window.location.pathname);
}

/** Client-side: window pathname’e göre admin demosu. */
export function isAdminDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return isAdminDemoPath(window.location.pathname);
}

export function getPersonnelPanelBase(pathname: string | null | undefined): string {
  return isPersonnelDemoPath(pathname) ? PERSONNEL_DEMO_BASE : '/personnel-panel';
}

export function getAdminPanelBase(pathname: string | null | undefined): string {
  return isAdminDemoPath(pathname) ? ADMIN_DEMO_BASE : '/admin-panel';
}

export function isPersonnelPanelHome(pathname: string | null | undefined): boolean {
  return pathname === '/personnel-panel' || pathname === PERSONNEL_DEMO_BASE;
}

/** `/personnel-panel[/demo]/sub` eşleşmesi */
export function isPersonnelSubpath(pathname: string | null | undefined, sub: string): boolean {
  if (!pathname) return false;
  const base = getPersonnelPanelBase(pathname);
  return pathname === `${base}/${sub}` || pathname.startsWith(`${base}/${sub}/`);
}

/**
 * `/personnel-panel/...` href’ini mevcut moda (normal / demo) göre yeniden yazar.
 */
export function personnelHref(pathname: string | null | undefined, href: string): string {
  if (!href.startsWith('/personnel-panel')) return href;
  const base = getPersonnelPanelBase(pathname);
  if (base === '/personnel-panel') return href;
  if (href === '/personnel-panel' || href.startsWith('/personnel-panel?')) {
    return `${PERSONNEL_DEMO_BASE}${href.slice('/personnel-panel'.length)}`;
  }
  return href.replace(/^\/personnel-panel/, PERSONNEL_DEMO_BASE);
}

/**
 * `/admin-panel/...` href’ini mevcut moda göre yeniden yazar.
 */
export function adminHref(pathname: string | null | undefined, href: string): string {
  if (!href.startsWith('/admin-panel')) return href;
  const base = getAdminPanelBase(pathname);
  if (base === '/admin-panel') return href;
  if (href === '/admin-panel' || href.startsWith('/admin-panel?')) {
    return `${ADMIN_DEMO_BASE}${href.slice('/admin-panel'.length)}`;
  }
  return href.replace(/^\/admin-panel/, ADMIN_DEMO_BASE);
}

export const DEMO_WRITE_BLOCKED_MESSAGE = 'Demo modunda kayıt yapılmaz. Örnek verilerle geziniyorsunuz.';
