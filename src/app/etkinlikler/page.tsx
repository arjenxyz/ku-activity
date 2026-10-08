import { HomeHeader } from '@/components/home/HomeHeader';

export default function EventsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">Etkinlikler</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-500">
          Yayındaki etkinlikler burada listelenir.
        </p>
      </div>
    </div>
  );
}
