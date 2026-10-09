import { StaffEventWorkspace } from '@/components/staff/StaffEventWorkspace';

type Props = { params: Promise<{ id: string }> };

export default async function StaffEventWorkspacePage({ params }: Props) {
  const { id } = await params;
  return <StaffEventWorkspace eventId={id} />;
}
