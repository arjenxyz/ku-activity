import Link from 'next/link';
import { HomeHeader } from '@/components/home/HomeHeader';
import { DEMO_EVENTS } from '@/lib/demo/data';

export default function EventsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">Etkinlikler</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-500">
          Yayındaki etkinlikler burada listelenir.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {DEMO_EVENTS.map((event) => (
            <li key={event.id}>
              <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-5 transition hover:border-[#2D6AF6]/30 hover:bg-[#e8f0ff]">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#0E1548]">{event.title}</h2>
                  <span className="shrink-0 rounded-full bg-[#e8f0ff] px-2.5 py-1 text-xs font-medium text-[#2D6AF6]">
                    {event.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{event.location}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`}
                </p>
                <p className="mt-4 text-xs text-slate-500">Kontenjan {event.capacity}</p>
                <Link
                  href="/forum"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#152060]"
                >
                  Kayda git
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
