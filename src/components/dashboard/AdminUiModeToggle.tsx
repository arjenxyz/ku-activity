'use client';

import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import type { AdminUiMode } from '@/lib/admin-ui-mode';
import strings from '@json/src/components/dashboard/AdminUiModeToggle.json';

type Props = {
  compact?: boolean;
  className?: string;
};

export function AdminUiModeToggle({ compact, className = '' }: Props) {
  const { mode, setMode, ready } = useAdminUiMode();

  if (!ready) return null;

  const options: AdminUiMode[] = ['simple', 'advanced'];

  return (
    <div
      className={`inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 ${className}`}
      role="group"
      aria-label={strings.ariaLabel}
    >
      {options.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setMode(id)}
          className={`px-2.5 sm:px-3 py-1.5 flex-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            mode === id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          title={id === 'simple' ? strings.simpleTitle : strings.advancedTitle}
        >
          {compact
            ? id === 'simple'
              ? strings.simpleCompact
              : strings.advancedCompact
            : strings[id]}
        </button>
      ))}
    </div>
  );
}
