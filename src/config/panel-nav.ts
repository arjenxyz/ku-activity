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
  { href: '/admin', label: 'Dashboard', icon: 'home' },
  { href: '/admin/events', label: 'Events', icon: 'calendar' },
  { href: '/admin/participants', label: 'Participants', icon: 'users' },
  { href: '/admin/check-in', label: 'Check-in', icon: 'check' },
  { href: '/admin/reports', label: 'Reports', icon: 'file' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'clipboard' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export const STAFF_NAV: NavItem[] = [
  { href: '/staff', label: 'Events', icon: 'calendar' },
  { href: '/staff/check-in', label: 'Check-in', icon: 'check' },
];

export const STUDENT_NAV: NavItem[] = [
  { href: '/student', label: 'Events', icon: 'calendar' },
  { href: '/student/registrations', label: 'My registrations', icon: 'clipboard' },
  { href: '/student/qr', label: 'My QR', icon: 'check' },
];
