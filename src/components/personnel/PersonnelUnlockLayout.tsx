'use client';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { personnelAuthCardClass } from '@/lib/personnel-auth-ui';

export function PersonnelUnlockLayout({ children }: { children: React.ReactNode }) {
  const strings = useRegistryStrings('components/personnel/PersonnelUnlockLayout');

  return (
    <AuthScreenShell screenLabel={strings.screenLabel} panelLabel={strings.panelLabel} tone="home">
      <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-8 safe-pb">
        <div className={`w-full max-w-md ${personnelAuthCardClass} p-6 sm:p-7`}>{children}</div>
      </div>
    </AuthScreenShell>
  );
}
