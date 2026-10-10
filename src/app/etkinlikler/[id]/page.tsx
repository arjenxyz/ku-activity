import { notFound } from 'next/navigation';
import { HomeHeader } from '@/components/home/HomeHeader';
import { StudentEventDetail } from '@/components/events/StudentEventDetail';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { getCatalogEvent, isRegistrationOpen } from '@/lib/events/catalog-store';
import {
  listRegistrationsForEvent,
  listRegistrationsForOwner,
  ownerKeyForRole,
} from '@/lib/demo/registrations-store';

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = getCatalogEvent(id);
  if (!event) notFound();

  const session = await getSiteSession();
  const taken = listRegistrationsForEvent(event.id).length;
  const seatsLeft = Math.max(0, event.capacity - taken);
  const open = isRegistrationOpen(event);
  const mine =
    session?.role === 'student'
      ? listRegistrationsForOwner(ownerKeyForRole('student')).find(
          (row) => row.eventId === event.id && row.status !== 'cancelled'
        )
      : null;

  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-12 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <StudentEventDetail
        event={event}
        taken={taken}
        seatsLeft={seatsLeft}
        open={open}
        mine={mine ?? null}
        isStudent={session?.role === 'student'}
      />
    </div>
  );
}
