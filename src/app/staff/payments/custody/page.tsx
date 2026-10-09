import { Suspense } from 'react';
import { AdminCustodyPanel } from '@/components/admin/AdminCustodyPanel';

export default function StaffCustodyPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <AdminCustodyPanel />
    </Suspense>
  );
}
