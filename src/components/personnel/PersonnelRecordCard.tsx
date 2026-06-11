import type { ReactNode } from 'react';

export function PersonnelSection({
  title,
  icon,
  children,
  emptyMessage = 'Kayıt bulunamadı',
  isEmpty,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        {icon}
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {isEmpty ? (
        <p className="px-4 sm:px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

export function PersonnelRecordRow({
  left,
  right,
  sub,
}: {
  left: ReactNode;
  right: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50/80 dark:hover:bg-slate-900/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{left}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{right}</div>
      </div>
    </div>
  );
}

export function PersonnelBadge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'default';
}) {
  const styles = {
    success: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    default: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
