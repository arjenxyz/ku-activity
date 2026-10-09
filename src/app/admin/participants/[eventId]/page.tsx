import { AdminEventParticipantsList } from '@/components/admin/AdminEventParticipantsList';

export default async function AdminEventParticipantsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <AdminEventParticipantsList eventId={eventId} />;
}
