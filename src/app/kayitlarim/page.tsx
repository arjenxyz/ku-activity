import { Suspense } from 'react';
import { HomeHeader } from '@/components/home/HomeHeader';
import { MyRegistrationsClient } from '@/components/registrations/MyRegistrationsClient';
import { getSiteSession } from '@/lib/auth/get-site-session';

export default async function MyRegistrationsPage() {
  const session = await getSiteSession();

  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">Etkinliklerim</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-500">
          {session?.name ? `${session.name} · ` : ''}
          Başvuruların, ücret ödemesi ve geçiş kartların burada.
        </p>
        {session?.demo ? (
          <p className="mx-auto mt-4 max-w-md rounded-2xl bg-white/70 px-3 py-2 text-center text-xs font-medium text-[#0E1548]">
            Demo oturumu — kayıtlar bu sunucu belleğinde tutulur.
          </p>
        ) : null}
        <div className="mt-8">
          <Suspense fallback={<p className="text-center text-sm text-slate-500">Yükleniyor…</p>}>
            <MyRegistrationsClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
