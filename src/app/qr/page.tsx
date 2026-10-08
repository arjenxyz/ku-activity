import { HomeHeader } from '@/components/home/HomeHeader';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { DEMO_PARTICIPANTS } from '@/lib/demo/data';

export default async function MyQrPage() {
  const session = await getSiteSession();
  const mine = DEMO_PARTICIPANTS.find((row) => row.isDemoStudent);

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
            Demo QR kişisel veri taşımaz.
          </p>
        ) : null}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-8 text-center">
          <div className="mx-auto grid h-40 w-40 grid-cols-5 gap-1 rounded-2xl bg-[#0E1548] p-3">
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                key={index}
                className={`rounded-sm ${index % 3 === 0 ? 'bg-white' : 'bg-[#0E1548]'}`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-[#0E1548]">{mine?.registrationNo}</p>
          <p className="mt-1 text-xs text-slate-500">
            {session?.name ?? mine?.name} · {mine?.event}
          </p>
        </div>
      </div>
    </div>
  );
}
