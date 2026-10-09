import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AdminPaymentReviews } from '@/components/admin/AdminPaymentReviews';

type Props = { searchParams: Promise<{ eventId?: string }> };

export default async function AdminPaymentReviewsPage({ searchParams }: Props) {
  const { eventId } = await searchParams;
  if (!eventId?.trim()) redirect('/admin/events');

  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <AdminPaymentReviews eventId={eventId.trim()} />
    </Suspense>
  );
}
