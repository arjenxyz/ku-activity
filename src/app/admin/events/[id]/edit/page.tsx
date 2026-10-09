import { notFound } from 'next/navigation';
import { AdminEventForm } from '@/components/admin/AdminEventForm';
import { getCatalogEvent } from '@/lib/events/catalog-store';
import { listRegistrationsForEvent } from '@/lib/demo/registrations-store';

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const event = getCatalogEvent(id);
  if (!event) notFound();

  return (
    <AdminEventForm
      mode="edit"
      eventId={event.id}
      event={{
        ...event,
        registeredCount: listRegistrationsForEvent(event.id).length,
      }}
    />
  );
}
