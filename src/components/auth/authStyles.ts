export const inputClass =
  'w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 placeholder-gray-400 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

export const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export const primaryButtonClass =
  'w-full min-h-touch py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 text-base';

export const linkButtonClass =
  'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors text-sm';

export const methodToggleWrapClass =
  'flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700';

export function methodToggleBtnClass(active: boolean) {
  return `flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
    active
      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
  }`;
}
