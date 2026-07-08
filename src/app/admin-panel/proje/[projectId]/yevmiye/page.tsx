'use client';

import { useParams } from 'next/navigation';
import { AttendanceQrPanel } from '@/components/project/AttendanceQrPanel';

export default function YevmiyePage() {
  const { projectId } = useParams() as { projectId: string };

  return (
    <div className="mx-auto max-w-lg sm:max-w-2xl">
      <AttendanceQrPanel projectId={projectId} />
    </div>
  );
}
