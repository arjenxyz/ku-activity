export type AppRole = 'student' | 'staff' | 'admin';

export function isAppRole(value: unknown): value is AppRole {
  return value === 'student' || value === 'staff' || value === 'admin';
}

export function homePathForRole(role: AppRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'staff':
      return '/staff';
    default:
      return '/student';
  }
}
