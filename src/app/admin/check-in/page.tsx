import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AdminCheckInClient } from '@/components/admin/AdminCheckInClient';

type Props = { searchParams: Promise<{ eventId?: string }> };

export default async function AdminCheckInPage({ searchParams }: Props) {
  const { eventId } = await searchParams;
  if (!eventId?.trim()) redirect('/admin/events');

  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <AdminCheckInClient eventId={eventId.trim()} />
    </Suspense>
  );
}
