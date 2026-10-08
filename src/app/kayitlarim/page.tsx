import Link from 'next/link';
import { HomeHeader } from '@/components/home/HomeHeader';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { DEMO_PARTICIPANTS } from '@/lib/demo/data';

export default async function MyRegistrationsPage() {
  const session = await getSiteSession();
  const rows = DEMO_PARTICIPANTS.filter((row) => row.isDemoStudent);

  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">Kayıtlarım</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-500">
          {session?.name ? `${session.name} · ` : ''}
          Etkinlik kayıtların burada listelenir.
        </p>
        {session?.demo ? (
          <p className="mx-auto mt-4 max-w-md rounded-2xl bg-white/70 px-3 py-2 text-center text-xs font-medium text-[#0E1548]">
            Demo oturumu — ekrandaki kayıtlar örnek veridir.
          </p>
        ) : null}
        <ul className="mt-8 space-y-3">
          {rows.map((row) => (
            <li
              key={row.registrationNo}
              className="rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#0E1548]">{row.event}</p>
                  <p className="mt-1 text-sm text-slate-500">{row.registrationNo}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e8f0ff] px-2.5 py-1 text-xs font-medium text-[#2D6AF6]">
                  {row.attendance}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Kayıt {row.registeredAt} · {row.day}
              </p>
              <Link
                href="/qr"
                className="mt-4 inline-flex text-sm font-medium text-[#2D6AF6] hover:underline"
              >
                QR kodumu göster
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
