import { EventCard } from '@/components/events/EventCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { listCatalogEvents } from '@/lib/events/catalog';
import { listRegistrationsForEvent, listRegistrationsForOwner, ownerKeyForRole } from '@/lib/demo/registrations-store';

export default async function EventsPage() {
  const session = await getSiteSession();
  const isStudent = session?.role === 'student';
  const mineIds = new Set(
    isStudent
      ? listRegistrationsForOwner(ownerKeyForRole('student'))
          .filter((row) => row.status !== 'cancelled')
          .map((row) => row.eventId)
      : []
  );
  const events = listCatalogEvents();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#e7f3fb] px-4 pb-12 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(45,106,246,0.12),_transparent_60%)]" />
      <HomeHeader />
      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D6AF6]">Keşfet</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0E1548]">Etkinlikler</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Yayındaki etkinlikler · {events.length} kayıt
          </p>
        </header>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              alreadyIn={mineIds.has(event.id)}
              taken={listRegistrationsForEvent(event.id).length}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
