export function AdminDashboard() {
  return (
    <div className="flex min-h-[min(70dvh,560px)] flex-col items-center justify-center px-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#0E1548] sm:text-3xl">
        Hoş geldin
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        Yönetim paneline hoş geldin. Etkinlikler, ekip ve diğer araçlara menüden ulaşabilirsin.
      </p>
    </div>
  );
}
