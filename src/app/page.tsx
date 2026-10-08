import Link from 'next/link';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHeader } from '@/components/home/HomeHeader';
import { APP_TAGLINE_TR } from '@/lib/brand';

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900">
      <HomeHeader />

      <main>
        <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-white" />
            <div className="absolute -top-24 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="absolute right-[-4rem] top-16 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
              Öğrenci hizmeti · üniversiteden bağımsız
            </p>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-[#2D6AF6] sm:text-5xl">
              Etkinlikleri gör,
            </h1>
            <h2 className="mt-1 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              kaydını tamamla.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {APP_TAGLINE_TR}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-[#0E1548] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060]"
              >
                Giriş yap
              </Link>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
