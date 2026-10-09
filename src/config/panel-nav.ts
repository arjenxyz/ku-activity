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

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Kontrol paneli', icon: 'home' },
  { href: '/admin/events', label: 'Etkinlikler', icon: 'calendar' },
  { href: '/admin/participants', label: 'Katılımcılar', icon: 'users' },
  { href: '/admin/payments', label: 'Ödemeler', icon: 'clipboard' },
  { href: '/admin/check-in', label: 'Check-in', icon: 'check' },
  { href: '/admin/reports', label: 'Raporlar', icon: 'file' },
  { href: '/admin/audit-logs', label: 'Denetim kayıtları', icon: 'file' },
  { href: '/admin/settings', label: 'Ayarlar', icon: 'settings' },
];

export const STAFF_NAV: NavItem[] = [
  { href: '/staff', label: 'Etkinlikler', icon: 'calendar' },
  { href: '/staff/check-in', label: 'Check-in', icon: 'check' },
  { href: '/staff/payments/cash', label: 'Elden teslim', icon: 'users' },
];

export const STUDENT_NAV: NavItem[] = [
  { href: '/student', label: 'Etkinlikler', icon: 'calendar' },
  { href: '/student/registrations', label: 'Kayıtlarım', icon: 'clipboard' },
  { href: '/student/qr', label: 'QR kodum', icon: 'check' },
];
