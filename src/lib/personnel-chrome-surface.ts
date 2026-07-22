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
  return 'bg-slate-50 dark:bg-slate-950';
}
