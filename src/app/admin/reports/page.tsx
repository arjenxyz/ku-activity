import { redirect } from 'next/navigation';
import { DemoPanel } from '@/components/demo/DemoPanel';

type Props = { searchParams: Promise<{ eventId?: string }> };

export default async function Page({ searchParams }: Props) {
  const { eventId } = await searchParams;
  if (!eventId?.trim()) redirect('/admin/events');

  return <DemoPanel view="admin-reports" />;
}
