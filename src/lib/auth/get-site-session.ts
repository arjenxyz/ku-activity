import { cookies } from 'next/headers';
import { getSessionProfile } from '@/lib/auth/get-profile';
import type { AppRole } from '@/lib/auth/roles';
import { DEMO_ACCOUNTS } from '@/lib/demo/accounts';
import { DEMO_COOKIE, parseDemoRole } from '@/lib/demo/session';

export type SiteSession = {
  role: AppRole;
  name: string;
  demo: boolean;
};

export async function getSiteSession(): Promise<SiteSession | null> {
  const jar = await cookies();
  const demoRole = parseDemoRole(jar.get(DEMO_COOKIE)?.value);
  if (demoRole) {
    const account = DEMO_ACCOUNTS.find((item) => item.role === demoRole);
    return {
      role: demoRole,
      name: account?.fullName ?? 'Kullanıcı',
      demo: true,
    };
  }

  try {
    const profile = await getSessionProfile();
    if (!profile) return null;
    return {
      role: profile.role,
      name: profile.full_name?.trim() || profile.email || 'Kullanıcı',
      demo: false,
    };
  } catch {
    return null;
  }
}
