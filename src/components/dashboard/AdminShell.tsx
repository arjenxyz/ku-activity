'use client';

type AdminShellProps = {
  children: React.ReactNode;
  compact?: boolean;
};

export function AdminShell({ children, compact = false }: AdminShellProps) {
  return (
    <div className="min-h-[100dvh] bg-slate-50 sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-indigo-50 no-print">
      <div className="hidden sm:block absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-indigo-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <main
        className={
          compact
            ? 'max-w-5xl mx-auto px-3 sm:px-6 py-0 sm:py-4 sm:safe-pb'
            : 'max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6 sm:safe-pb'
        }
      >
        {children}
      </main>
    </div>
  );
}
