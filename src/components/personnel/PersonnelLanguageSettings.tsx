'use client';

import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function PersonnelLanguageSettings() {
  const strings = useRegistryStrings('components/personnel/PersonnelSettingsPage');

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{strings.language.label}</p>
          <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{strings.language.hint}</p>
        </div>
        <LanguageSwitch variant="compact" />
      </div>
    </div>
  );
}
