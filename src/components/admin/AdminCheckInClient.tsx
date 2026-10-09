'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { StaffCheckInClient } from '@/components/checkin/StaffCheckInClient';

export function AdminCheckInClient({ eventId }: { eventId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/events/${eventId}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548]"
          aria-label="Çalışma alanına dön"
        >
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-[#0E1548]">Check-in</h1>
          <p className="text-xs text-slate-500">Bu etkinlik için QR yoklama.</p>
        </div>
      </div>
      <StaffCheckInClient lockedEventId={eventId} />
    </div>
  );
}
