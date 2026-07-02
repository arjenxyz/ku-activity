'use client';

type PersonnelShellProps = {
  children: React.ReactNode;
};

export function PersonnelShell({ children }: PersonnelShellProps) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-indigo-50 dark:sm:from-slate-950 dark:sm:via-slate-900 dark:sm:to-blue-950 no-print">
      <div className="hidden sm:block absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-8 sm:safe-pt sm:safe-pb">{children}</main>
    </div>
  );
}
