import Link from 'next/link';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { DEMO_PARTICIPANTS } from '@/lib/demo/data';

export async function StudentHomeTools() {
  const session = await getSiteSession();
  if (!session || session.role !== 'student') return null;

  const mine = DEMO_PARTICIPANTS.find((row) => row.isDemoStudent);

  return (
    <section className="border-t border-slate-100 bg-[#e7f3fb]/70 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#2D6AF6]">Öğrenci oturumu</p>
        <h2 className="mt-1 text-xl font-semibold text-[#0E1548]">Merhaba, {session.name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Kayıtların ve QR kodun ana sitede; ayrı bir öğrenci paneli yok.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link
            href="/etkinlikler"
            className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 transition hover:border-[#2D6AF6]/30 hover:bg-[#e8f0ff]"
          >
            <p className="text-sm font-semibold text-[#0E1548]">Etkinlikler</p>
            <p className="mt-1 text-xs text-slate-500">Yayındaki etkinlikleri gör</p>
          </Link>
          <Link
            href="/kayitlarim"
            className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 transition hover:border-[#2D6AF6]/30 hover:bg-[#e8f0ff]"
          >
            <p className="text-sm font-semibold text-[#0E1548]">Kayıtlarım</p>
            <p className="mt-1 text-xs text-slate-500">
              {mine ? `${mine.event} · ${mine.attendance}` : 'Kayıtlarını yönet'}
            </p>
          </Link>
          <Link
            href="/qr"
            className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 transition hover:border-[#2D6AF6]/30 hover:bg-[#e8f0ff]"
          >
            <p className="text-sm font-semibold text-[#0E1548]">QR kodum</p>
            <p className="mt-1 text-xs text-slate-500">Check-in için göster</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
