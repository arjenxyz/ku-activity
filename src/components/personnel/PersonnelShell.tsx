'use client';

type PersonnelShellProps = {
  children: React.ReactNode;
  settingsMode?: boolean;
  /** Fill remaining viewport height and vertically center content (e.g. calendar tab). */
  centeredViewport?: boolean;
};

export function PersonnelShell({
  children,
  settingsMode = false,
  centeredViewport = false,
}: PersonnelShellProps) {
  const surface =
    'bg-slate-50 dark:bg-slate-950 sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-indigo-50 dark:sm:from-slate-950 dark:sm:via-slate-900 dark:sm:to-blue-950 no-print';

  const shellClass = settingsMode
    ? 'relative min-h-[calc(100dvh-var(--personnel-topbar-h))] bg-[#f0f2f5] dark:bg-slate-950 sm:min-h-[100dvh] sm:bg-gradient-to-br sm:from-blue-50 sm:via-white sm:to-indigo-50 dark:sm:from-slate-950 dark:sm:via-slate-900 dark:sm:to-blue-950 no-print'
    : centeredViewport
      ? `relative flex h-[calc(100dvh-var(--personnel-topbar-h)-5.25rem-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden ${surface}`
      : `relative min-h-[100dvh] ${surface}`;

  const mainClass = settingsMode
    ? 'max-w-5xl mx-auto px-3 sm:px-6 py-0 sm:py-6 sm:safe-pb'
    : centeredViewport
      ? 'mx-auto flex h-full w-full max-w-5xl flex-1 items-center px-3 py-0 sm:px-6'
      : 'max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6 sm:safe-pb';

  return (
    <div className={shellClass}>
      <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block">
        <div className="absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/4 -translate-y-1/3 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/5" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] -translate-x-1/4 translate-y-1/3 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5" />
      </div>

      <main className={mainClass}>{children}</main>
    </div>
  );
}
