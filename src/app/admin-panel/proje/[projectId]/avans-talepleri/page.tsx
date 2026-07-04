'use client';

import strings from '@json/src/app/admin-panel/proje/[projectId]/avans-talepleri/page.json';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { AdminAdvanceRequestsPanel } from '@/components/advance/AdminAdvanceRequestsPanel';

function Content() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  if (!projectId) return <p className="text-sm text-red-600">{strings.projectNotFound}</p>;
  return <AdminAdvanceRequestsPanel projectId={projectId} />;
}

export default function AvansTalepleriPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">{strings.loading}</div>}>
      <Content />
    </Suspense>
  );
}
