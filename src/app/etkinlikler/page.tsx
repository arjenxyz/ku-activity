import { EventsDiscover } from '@/components/events/EventsDiscover';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeFooter } from '@/components/home/HomeFooter';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { listCatalogEvents } from '@/lib/events/catalog-store';
import {
  listRegistrationsForEvent,
  listRegistrationsForOwner,
  ownerKeyForRole,
} from '@/lib/demo/registrations-store';
import { presentRegistration } from '@/lib/registrations/present';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const session = await getSiteSession();
  const isStudent = session?.role === 'student';
  const myRegs = isStudent
    ? listRegistrationsForOwner(ownerKeyForRole('student')).filter((row) => row.status !== 'cancelled')
    : [];
  const initialMine: Record<string, { needsPayment: boolean }> = {};
  for (const row of myRegs) {
    initialMine[row.eventId] = { needsPayment: presentRegistration(row).needsPayment };
  }

  const initialEvents = listCatalogEvents().map((event) => ({
    ...event,
    registeredCount: listRegistrationsForEvent(event.id).length,
  }));

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#e7f3fb] px-4 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(45,106,246,0.12),_transparent_60%)]" />
      <HomeHeader />
      <div className="relative mx-auto w-full max-w-5xl flex-1 pb-12">
        <EventsDiscover initialEvents={initialEvents} initialMine={initialMine} />
      </div>
      <HomeFooter />
    </div>
  );
}
