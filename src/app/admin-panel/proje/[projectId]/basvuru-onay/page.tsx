'use client';


import { Suspense } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useParams } from 'next/navigation';
import { AdminBasvuruOnayPanel } from '@/components/registration/AdminBasvuruOnayPanel';

function BasvuruOnayContent() {
  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/basvuru-onay/page');

  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  if (!projectId) {
    return <p className="text-sm text-red-600">{strings.projectNotFound}</p>;
  }

  return <AdminBasvuruOnayPanel projectId={projectId} />;
}

export default function ProjectBasvuruOnayPage() {

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/basvuru-onay/page');
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
