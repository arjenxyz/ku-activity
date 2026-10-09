import { AdminEventWorkspace } from '@/components/admin/AdminEventWorkspace';

type Props = { params: Promise<{ id: string }> };

export default async function AdminEventWorkspacePage({ params }: Props) {
  const { id } = await params;
  return <AdminEventWorkspace eventId={id} />;
}
