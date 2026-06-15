'use client';

import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { ADMIN_UI_MODE_LABELS, type AdminUiMode } from '@/lib/admin-ui-mode';

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
      aria-label="Arayüz modu"
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
          title={
            id === 'simple'
              ? 'Yoklama, yevmiye, avans ve onaylar'
              : 'Blok, kâr, raporlar ve tüm ayarlar'
          }
        >
          {compact ? (id === 'simple' ? 'Basit' : 'Gelişmiş') : ADMIN_UI_MODE_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
