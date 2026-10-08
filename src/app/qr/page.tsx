import { HomeHeader } from '@/components/home/HomeHeader';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { DEMO_CHECKIN_TOKEN, DEMO_PARTICIPANTS } from '@/lib/demo/data';

export default async function MyQrPage() {
  const session = await getSiteSession();
  const mine = DEMO_PARTICIPANTS.find((row) => row.isDemoStudent);
  const qrSrc = `/api/qr?token=${encodeURIComponent(DEMO_CHECKIN_TOKEN)}`;

  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">QR kodum</h1>
        <p className="mx-auto mt-2 text-center text-sm leading-relaxed text-slate-500">
          Check-in sırasında görevliye göster.
        </p>
        {session?.demo ? (
          <p className="mt-4 rounded-2xl bg-white/70 px-3 py-2 text-center text-xs font-medium text-[#0E1548]">
            Gerçek QR görüntüsü — içerik yalnızca demo token; ad veya öğrenci no yok.
          </p>
        ) : null}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="Check-in QR kodu"
            width={220}
            height={220}
            className="mx-auto h-44 w-44 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100"
          />
          <p className="mt-4 text-sm font-semibold text-[#0E1548]">{mine?.registrationNo}</p>
          <p className="mt-1 text-xs text-slate-500">
            {session?.name ?? mine?.name} · {mine?.event}
          </p>
        </div>
      </div>
    </div>
  );
}
