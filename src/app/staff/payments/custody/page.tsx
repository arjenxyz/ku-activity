import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AdminCustodyPanel } from '@/components/admin/AdminCustodyPanel';

type Props = { searchParams: Promise<{ eventId?: string; token?: string }> };

export default async function StaffCustodyPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.eventId?.trim() && !params.token?.trim()) redirect('/staff');

  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <AdminCustodyPanel />
    </Suspense>
  );
}
