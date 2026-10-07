import type { NavItem } from '@/components/dashboard/PanelChrome';

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/participants', label: 'Participants' },
  { href: '/admin/check-in', label: 'Check-in' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
  { href: '/admin/settings', label: 'Settings' },
];

export const STAFF_NAV: NavItem[] = [
  { href: '/staff', label: 'Events' },
  { href: '/staff/check-in', label: 'Check-in' },
];

export const STUDENT_NAV: NavItem[] = [
  { href: '/student', label: 'Events' },
  { href: '/student/registrations', label: 'My registrations' },
  { href: '/student/qr', label: 'My QR' },
];
