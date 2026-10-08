import Link from 'next/link';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHeader } from '@/components/home/HomeHeader';
import { RegistrationPreview } from '@/components/home/RegistrationPreview';
import { APP_TAGLINE_TR } from '@/lib/brand';

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900">
      <HomeHeader />

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-[calc(var(--home-chrome-h,4.5rem)+2.5rem)] sm:px-6 md:pb-24 md:pt-[calc(var(--home-chrome-h,4.5rem)+4rem)] lg:min-h-[100dvh] lg:pb-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-white" />
            <div className="absolute -top-24 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl md:h-96 md:w-96" />
            <div className="absolute right-[-4rem] top-16 hidden h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl md:block" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <p className="inline-flex rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                Öğrenci hizmeti · üniversiteden bağımsız
              </p>
              <h1 className="mt-5 text-balance text-[2rem] font-bold leading-tight tracking-tight text-[#2D6AF6] sm:text-5xl lg:text-6xl">
                Etkinlikleri gör,
              </h1>
              <h2 className="mt-1 text-balance text-[2rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                kaydını tamamla.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
                {APP_TAGLINE_TR}
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0E1548] px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060] sm:w-auto sm:min-w-40"
                >
                  Giriş yap
                </Link>
              </div>
            </div>

            <RegistrationPreview />
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
