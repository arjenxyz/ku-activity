'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { AdminBasvuruOnayPanel } from '@/components/registration/AdminBasvuruOnayPanel';

function BasvuruOnayContent() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  if (!projectId) {
    return <p className="text-sm text-red-600">Proje bulunamadı.</p>;
  }

  return <AdminBasvuruOnayPanel projectId={projectId} />;
}

export default function ProjectBasvuruOnayPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">Başvuru onayı yükleniyor…</div>
      }
    >
      <BasvuruOnayContent />
    </Suspense>
  );
}
