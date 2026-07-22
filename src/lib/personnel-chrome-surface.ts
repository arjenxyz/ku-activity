/** Personel paneli sayfa arka planı — üst bar kabuğu ve chrome sarmalayıcı ile eşleşir. */
export function personnelChromeSurfaceClass(pathname: string, tab: string | null): string {
  if (pathname.startsWith('/personnel-panel/yoklama')) {
    return 'bg-black';
  }
  if (pathname.startsWith('/personnel-panel/avans-onay')) {
    return 'bg-[#060d14]';
  }
  if (pathname === '/personnel-panel' && tab === 'settings') {
    return 'bg-[#f0f2f5] dark:bg-slate-950';
  }
  if (pathname === '/personnel-panel' && tab === 'work') {
    return 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950';
  }
  return 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950';
}
