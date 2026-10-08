import { Suspense } from 'react';
import { HomeHeader } from '@/components/home/HomeHeader';
import { StudentQrClient } from '@/components/qr/StudentQrClient';
import { getSiteSession } from '@/lib/auth/get-site-session';

export default async function MyQrPage() {
  const session = await getSiteSession();

  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">QR kodum</h1>
        <p className="mx-auto mt-2 text-center text-sm leading-relaxed text-slate-500">
          Check-in sırasında görevliye göster.
        </p>
        <Suspense fallback={<p className="mt-8 text-center text-sm text-slate-500">Yükleniyor…</p>}>
          <StudentQrClient demoHint={session?.demo} />
        </Suspense>
      </div>
    </div>
  );
}
