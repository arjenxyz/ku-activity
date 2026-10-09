import { Suspense } from 'react';
import { AdminCashAccept } from '@/components/admin/AdminCashAccept';

export default function AdminCashAcceptPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <AdminCashAccept />
    </Suspense>
  );
}
