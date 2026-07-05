/** Kapanış durumu yüklenirken — özet sayfası flash etmesin */
export function PersonnelClosureLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}
