import { AdminParticipantDetail } from '@/components/admin/AdminParticipantDetail';

export default async function AdminParticipantDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; registrationNo: string }>;
}) {
  const { eventId, registrationNo } = await params;
  return <AdminParticipantDetail eventId={eventId} registrationNo={registrationNo} />;
}
