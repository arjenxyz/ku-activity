'use client';

type PersonnelShellProps = {
  children: React.ReactNode;
  settingsMode?: boolean;
};

export function PersonnelShell({ children, settingsMode = false }: PersonnelShellProps) {
  return (
    <div
      className={
        settingsMode
          ? 'min-h-[calc(100dvh-var(--personnel-topbar-h))] bg-[#f0f2f5] dark:bg-slate-950 sm:min-h-[100dvh] sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-indigo-50 dark:sm:from-slate-950 dark:sm:via-slate-900 dark:sm:to-blue-950 no-print'
          : 'min-h-[100dvh] bg-slate-50 dark:bg-slate-950 sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-indigo-50 dark:sm:from-slate-950 dark:sm:via-slate-900 dark:sm:to-blue-950 no-print'
      }
    >
      <div className="hidden sm:block absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <main
        className={
          settingsMode
            ? 'max-w-5xl mx-auto px-3 sm:px-6 py-0 sm:py-6 sm:safe-pb'
            : 'max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6 sm:safe-pb'
        }
      >
        {children}
      </main>
    </div>
  );
}
