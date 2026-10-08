import { HomeFooter } from '@/components/home/HomeFooter';
import { ExploreMenuButton, HomeHeader } from '@/components/home/HomeHeader';
import { RegistrationPreview } from '@/components/home/RegistrationPreview';
import { SlidingStars } from '@/components/home/SlidingStars';
import { APP_TAGLINE_TR } from '@/lib/brand';

export default function HomePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-slate-900">
      <HomeHeader />

      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-1 items-center overflow-hidden px-4 py-8 pt-[calc(var(--home-chrome-h,4.5rem)+1rem)] sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-white" />
            <div className="absolute -top-24 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl lg:h-[28rem] lg:w-[28rem]" />
            <div className="absolute right-0 top-1/3 hidden h-80 w-80 rounded-full bg-indigo-100/40 blur-3xl lg:block" />
            <SlidingStars />
          </div>

          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] lg:gap-14">
            <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <p className="inline-flex rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                Öğrenci hizmeti · üniversiteden bağımsız
              </p>
              <h1 className="mt-4 text-balance text-[2rem] font-bold leading-[1.1] tracking-tight text-[#2D6AF6] sm:text-5xl">
                Etkinlikleri gör,{' '}
                <span className="text-slate-900">kaydını tamamla.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
                {APP_TAGLINE_TR}
              </p>
              <div className="mt-6 flex justify-center lg:justify-start">
                <ExploreMenuButton className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0E1548] px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060] sm:w-auto sm:min-w-40" />
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
