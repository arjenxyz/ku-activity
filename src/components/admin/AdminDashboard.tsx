import Link from 'next/link';
import { FiArrowRight, FiBookOpen, FiCalendar } from 'react-icons/fi';

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0E1548] sm:text-3xl">
          Admin ana sayfası
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Etkinlikleri yönetmek için menüyü kullan. Paneli ilk kez görüyorsan Panel Eğitimi ile
          canlı rehberi açabilirsin.
        </p>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/admin/egitim"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-5 py-3 text-sm font-semibold text-white hover:bg-[#152060]"
        >
          <FiBookOpen className="h-4 w-4" aria-hidden />
          Panel Eğitimi
        </Link>
        <Link
          href="/admin/events"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-[#0E1548] hover:bg-slate-50"
        >
          <FiCalendar className="h-4 w-4" aria-hidden />
          Etkinlikler
          <FiArrowRight className="h-4 w-4 text-slate-400" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
