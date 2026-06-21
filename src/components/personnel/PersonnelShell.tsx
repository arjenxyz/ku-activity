'use client';

type PersonnelShellProps = {
  children: React.ReactNode;
};

export function PersonnelShell({ children }: PersonnelShellProps) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 no-print">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 safe-pt safe-pb">{children}</main>
    </div>
  );
}
