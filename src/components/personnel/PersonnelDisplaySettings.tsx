'use client';

import { usePersonnelDisplay } from '@/lib/personnel-display-preferences';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function PersonnelDisplaySettings() {

  const strings = useRegistryStrings('components/personnel/PersonnelDisplaySettings');
  const { largeText, highContrast, setLargeText, setHighContrast } = usePersonnelDisplay();

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          {strings.sectionTitle}
        </p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/80">
        <ToggleRow
          label={strings.largeTextLabel}
          hint={strings.largeTextHint}
          checked={largeText}
          onChange={setLargeText}
        />
        <ToggleRow
          label={strings.highContrastLabel}
          hint={strings.highContrastHint}
          checked={highContrast}
          onChange={setHighContrast}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
