'use client';

import strings from '@json/src/app/admin-panel/proje/[projectId]/basvuru-onay/page.json';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { AdminBasvuruOnayPanel } from '@/components/registration/AdminBasvuruOnayPanel';

function BasvuruOnayContent() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  if (!projectId) {
    return <p className="text-sm text-red-600">{strings.projectNotFound}</p>;
  }

  return <AdminBasvuruOnayPanel projectId={projectId} />;
}

export default function ProjectBasvuruOnayPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">{strings.loading}</div>
      }
    >
      <BasvuruOnayContent />
    </Suspense>
  );
}
