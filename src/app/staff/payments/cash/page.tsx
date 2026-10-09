import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AdminCashAccept } from '@/components/admin/AdminCashAccept';

type Props = { searchParams: Promise<{ eventId?: string; token?: string }> };

export default async function StaffCashAcceptPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.eventId?.trim() && !params.token?.trim()) redirect('/staff');

  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <AdminCashAccept eventId={params.eventId?.trim()} />
    </Suspense>
  );
}
