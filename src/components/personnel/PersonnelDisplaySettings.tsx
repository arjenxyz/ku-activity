'use client';

import { usePersonnelDisplay } from '@/lib/personnel-display-preferences';

export function PersonnelDisplaySettings() {
  const { largeText, highContrast, setLargeText, setHighContrast } = usePersonnelDisplay();

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Görünüm</p>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm text-gray-800 dark:text-gray-200">Büyük yazı</span>
        <input
          type="checkbox"
          checked={largeText}
          onChange={(e) => setLargeText(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-blue-600"
        />
      </label>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm text-gray-800 dark:text-gray-200">Yüksek kontrast</span>
        <input
          type="checkbox"
          checked={highContrast}
          onChange={(e) => setHighContrast(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-blue-600"
        />
      </label>
      <p className="text-xs text-gray-500">
        Sahada güneş altında okumayı kolaylaştırır.
      </p>
    </div>
  );
}
