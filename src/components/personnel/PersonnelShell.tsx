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
  const homeSurface = 'bg-slate-50 dark:bg-slate-950 no-print';

  const shellClass = settingsMode
    ? 'relative min-h-[calc(100dvh-var(--personnel-topbar-h))] bg-[#f0f2f5] dark:bg-slate-950 sm:min-h-[100dvh] no-print'
    : centeredViewport
      ? `relative flex h-[calc(100dvh-var(--personnel-topbar-h)-5.25rem-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden ${homeSurface}`
      : `relative min-h-[100dvh] ${homeSurface}`;

  const mainClass = settingsMode
    ? 'mx-auto w-full max-w-6xl px-3 py-0 safe-pb sm:px-6 sm:py-6'
    : centeredViewport
      ? 'mx-auto flex h-full w-full max-w-6xl flex-1 items-center px-3 py-0 sm:px-6'
      : 'mx-auto w-full max-w-6xl px-3 py-3 safe-pb sm:px-6 sm:py-5';

  return (
    <div className={shellClass}>
      <main className={mainClass}>{children}</main>
    </div>
  );
}
