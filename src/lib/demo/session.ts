import type { AppRole } from '@/lib/auth/roles';
import { isAppRole } from '@/lib/auth/roles';

export const DEMO_COOKIE = 'ems_demo_role';

export function parseDemoRole(value: string | undefined | null): AppRole | null {
  if (!value || !isAppRole(value)) return null;
  return value;
}
