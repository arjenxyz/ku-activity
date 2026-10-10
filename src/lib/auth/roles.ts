export type AppRole = 'student' | 'staff' | 'admin';

export function isAppRole(value: unknown): value is AppRole {
  return value === 'student' || value === 'staff' || value === 'admin';
}

export function homePathForRole(role: AppRole): string {
  switch (role) {
    case 'admin':
      return '/admin/events';
    case 'staff':
      return '/staff';
    default:
      // Students stay on the public site; only staff/admin use panels.
      return '/';
  }
}
