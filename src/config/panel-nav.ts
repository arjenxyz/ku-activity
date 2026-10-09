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

export const ADMIN_NAV: NavSection[] = [
  { href: '/admin', label: 'Kontrol paneli', icon: 'home' },
  {
    href: '/admin/events',
    label: 'Etkinlikler',
    icon: 'calendar',
    children: [
      { href: '/admin/events', label: 'Etkinlik listesi', icon: 'calendar' },
      { href: '/admin/events/new', label: 'Yeni etkinlik', icon: 'calendar' },
    ],
  },
  {
    href: '/admin/participants',
    label: 'Katılımcılar',
    icon: 'users',
    children: [
      { href: '/admin/participants', label: 'Etkinlik seç', icon: 'users' },
      { href: '/admin/payments/reviews', label: 'Havale incelemeleri', icon: 'clipboard' },
      { href: '/admin/payments/cash', label: 'Elden teslim al', icon: 'check' },
      { href: '/admin/payments/custody', label: 'Kasa / yetkili devir', icon: 'users' },
    ],
  },
  {
    href: '/admin/payments',
    label: 'Ödemeler',
    icon: 'clipboard',
    children: [
      { href: '/admin/payments/reviews', label: 'Havale incelemeleri', icon: 'clipboard' },
      { href: '/admin/payments/cash', label: 'Elden teslim al', icon: 'check' },
      { href: '/admin/payments/custody', label: 'Kasa / yetkili devir', icon: 'users' },
    ],
  },
  { href: '/admin/check-in', label: 'Check-in', icon: 'check' },
  { href: '/admin/reports', label: 'Raporlar', icon: 'file' },
  { href: '/admin/audit-logs', label: 'Denetim kayıtları', icon: 'file' },
  { href: '/admin/settings', label: 'Ayarlar', icon: 'settings' },
];

export const STAFF_NAV: NavSection[] = [
  { href: '/staff', label: 'Etkinlikler', icon: 'calendar' },
  { href: '/staff/check-in', label: 'Check-in', icon: 'check' },
  {
    href: '/staff/payments',
    label: 'Ödemeler',
    icon: 'clipboard',
    children: [
      { href: '/staff/payments/cash', label: 'Elden teslim al', icon: 'check' },
      { href: '/staff/payments/custody', label: 'Kasa / yetkili devir', icon: 'users' },
    ],
  },
];

export const STUDENT_NAV: NavSection[] = [
  { href: '/student', label: 'Etkinlikler', icon: 'calendar' },
  { href: '/student/registrations', label: 'Kayıtlarım', icon: 'clipboard' },
  { href: '/student/qr', label: 'QR kodum', icon: 'check' },
];

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
    if (!exactHome && !under) continue;
    if (section.href.length > bestLen) {
      best = section;
      bestLen = section.href.length;
    }
  }

  return best;
}

export function isNavItemActive(pathname: string, item: NavItem, homeHref: string) {
  if (item.href === homeHref) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
