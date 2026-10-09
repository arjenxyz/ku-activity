'use client';

type AdminShellProps = {
  children: React.ReactNode;
  compact?: boolean;
};

export function AdminShell({ children, compact = false }: AdminShellProps) {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-slate-50 sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-indigo-50 no-print">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block">
        <div className="absolute top-0 right-0 h-[420px] w-[420px] translate-x-1/4 -translate-y-1/3 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] -translate-x-1/4 translate-y-1/3 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <main
        className={
          compact
            ? 'mx-auto max-w-6xl px-3 py-0 sm:px-6 sm:py-4 sm:safe-pb lg:max-w-7xl lg:px-8'
            : 'mx-auto max-w-6xl px-3 py-3 sm:px-6 sm:py-6 sm:safe-pb lg:max-w-7xl lg:px-8'
        }
      >
        {children}
      </main>
    </div>
  );
}
