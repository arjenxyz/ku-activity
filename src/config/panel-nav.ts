import type { IconType } from 'react-icons';
import {
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiFileText,
  FiHome,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';

export type NavItem = {
  href: string;
  label: string;
  icon: IconType;
};

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: FiHome },
  { href: '/admin/events', label: 'Events', icon: FiCalendar },
  { href: '/admin/participants', label: 'Participants', icon: FiUsers },
  { href: '/admin/check-in', label: 'Check-in', icon: FiCheckSquare },
  { href: '/admin/reports', label: 'Reports', icon: FiFileText },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FiClipboard },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export const STAFF_NAV: NavItem[] = [
  { href: '/staff', label: 'Events', icon: FiCalendar },
  { href: '/staff/check-in', label: 'Check-in', icon: FiCheckSquare },
];

export const STUDENT_NAV: NavItem[] = [
  { href: '/student', label: 'Events', icon: FiCalendar },
  { href: '/student/registrations', label: 'My registrations', icon: FiClipboard },
  { href: '/student/qr', label: 'My QR', icon: FiCheckSquare },
];
