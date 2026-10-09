export type NavIconName =
  | 'home'
  | 'calendar'
  | 'users'
  | 'check'
  | 'file'
  | 'clipboard'
  | 'settings';

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

/** Top-level item that may expose contextual children while on that section. */
export type NavSection = NavItem & {
  children?: NavItem[];
};

/** Global admin menu — event tools live under an event workspace. */
export const ADMIN_NAV: NavSection[] = [
  { href: '/admin', label: 'Admin ana sayfası', icon: 'home' },
  {
    href: '/admin/events',
    label: 'Etkinlikler',
    icon: 'calendar',
    children: [
      { href: '/admin/events', label: 'Etkinlik listesi', icon: 'calendar' },
      { href: '/admin/events/new', label: 'Yeni etkinlik', icon: 'calendar' },
    ],
  },
  { href: '/admin/team', label: 'Ekip ilanı', icon: 'users' },
  { href: '/admin/egitim', label: 'Panel Eğitimi', icon: 'clipboard' },
  { href: '/admin/audit-logs', label: 'Denetim kayıtları', icon: 'file' },
  { href: '/admin/settings', label: 'Ayarlar', icon: 'settings' },
];

/** Global staff menu — tools appear after picking an event. */
export const STAFF_NAV: NavSection[] = [
  { href: '/staff', label: 'Etkinlikler', icon: 'calendar' },
];

export const STUDENT_NAV: NavSection[] = [
  { href: '/student', label: 'Etkinlikler', icon: 'calendar' },
  { href: '/student/registrations', label: 'Kayıtlarım', icon: 'clipboard' },
  { href: '/student/qr', label: 'QR kodum', icon: 'check' },
];

export function buildAdminEventNav(eventId: string): NavItem[] {
  const q = encodeURIComponent(eventId);
  return [
    { href: `/admin/events/${eventId}`, label: 'Çalışma alanı', icon: 'home' },
    { href: `/admin/participants/${eventId}`, label: 'Katılımcılar', icon: 'users' },
    { href: `/admin/payments/reviews?eventId=${q}`, label: 'Havale incelemeleri', icon: 'clipboard' },
    { href: `/admin/payments/cash?eventId=${q}`, label: 'Elden teslim al', icon: 'check' },
    { href: `/admin/payments/custody?eventId=${q}`, label: 'Kasa / yetkili devir', icon: 'users' },
    { href: `/admin/check-in?eventId=${q}`, label: 'Check-in', icon: 'check' },
    { href: `/admin/reports?eventId=${q}`, label: 'Raporlar', icon: 'file' },
    { href: `/admin/events/${eventId}/edit`, label: 'Düzenle', icon: 'settings' },
  ];
}

export function buildStaffEventNav(eventId: string): NavItem[] {
  const q = encodeURIComponent(eventId);
  return [
    { href: `/staff/events/${eventId}`, label: 'Çalışma alanı', icon: 'home' },
    { href: `/staff/check-in?eventId=${q}`, label: 'Check-in', icon: 'check' },
    { href: `/staff/payments/cash?eventId=${q}`, label: 'Elden teslim al', icon: 'check' },
    { href: `/staff/payments/custody?eventId=${q}`, label: 'Kasa / yetkili devir', icon: 'users' },
  ];
}

/**
 * Resolve active event id from path or ?eventId=.
 * /admin/events/new is not an event workspace.
 */
export function extractEventId(
  pathname: string,
  searchParams: { get(name: string): string | null },
  role: 'admin' | 'staff'
): string | null {
  const queryId = searchParams.get('eventId')?.trim() || null;

  if (role === 'admin') {
    const eventsMatch = pathname.match(/^\/admin\/events\/([^/]+)/);
    if (eventsMatch?.[1] && eventsMatch[1] !== 'new') return eventsMatch[1];

    const participantsMatch = pathname.match(/^\/admin\/participants\/([^/]+)/);
    if (participantsMatch?.[1]) return participantsMatch[1];

    if (
      queryId &&
      (pathname.startsWith('/admin/payments') ||
        pathname.startsWith('/admin/check-in') ||
        pathname.startsWith('/admin/reports'))
    ) {
      return queryId;
    }
    return null;
  }

  const staffEventsMatch = pathname.match(/^\/staff\/events\/([^/]+)/);
  if (staffEventsMatch?.[1]) return staffEventsMatch[1];

  if (
    queryId &&
    (pathname.startsWith('/staff/payments') || pathname.startsWith('/staff/check-in'))
  ) {
    return queryId;
  }
  return null;
}

/** Longest matching section with children wins (e.g. /payments over /). */
export function resolveNavSection(pathname: string, sections: NavSection[], homeHref: string) {
  let best: NavSection | null = null;
  let bestLen = -1;

  for (const section of sections) {
    if (!section.children?.length) continue;
    const exactHome = section.href === homeHref && pathname === section.href;
    const under =
      section.href !== homeHref &&
      (pathname === section.href || pathname.startsWith(`${section.href}/`));
    // Don't treat /admin/events/[id] as the generic Etkinlikler list children
    // (keep /admin/events/new on the list submenu).
    const eventSeg = pathname.match(/^\/admin\/events\/([^/]+)/)?.[1];
    if (section.href === '/admin/events' && eventSeg && eventSeg !== 'new') {
      continue;
    }
    if (!exactHome && !under) continue;
    if (section.href.length > bestLen) {
      best = section;
      bestLen = section.href.length;
    }
  }

  return best;
}

export function isNavItemActive(
  pathname: string,
  item: NavItem,
  homeHref: string,
  search = ''
) {
  const [itemPath, itemQuery = ''] = item.href.split('?');
  const currentQuery = search.startsWith('?') ? search.slice(1) : search;

  if (itemPath === homeHref) {
    return pathname === itemPath && (!itemQuery || currentQuery === itemQuery);
  }

  const pathMatch = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  if (!pathMatch) return false;
  if (!itemQuery) return true;

  const want = new URLSearchParams(itemQuery);
  const have = new URLSearchParams(currentQuery);
  for (const [key, value] of want.entries()) {
    if (have.get(key) !== value) return false;
  }
  return true;
}
