'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiChevronDown, FiMaximize } from 'react-icons/fi';

type Props = {
  eventId: string;
  registrationId: string;
  registrationNo: string;
  children: React.ReactNode;
};

/** QR (this event only) + collapsible details for registered students. */
export function RegisteredEventExtras({
  eventId,
  registrationId,
  registrationNo,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4">
        <p className="text-sm font-semibold text-[#0E1548]">Kayıtlısın</p>
        <p className="mt-0.5 text-xs text-slate-600">Kayıt no {registrationNo}</p>
        <p className="mt-2 text-sm text-slate-600">
          Check-in’de yalnızca bu etkinliğe ait QR’ın geçerli. Başka etkinliğin kodu kabul edilmez.
        </p>
        <Link
          href={`/qr?registration=${encodeURIComponent(registrationId)}&event=${encodeURIComponent(eventId)}`}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E1548] text-sm font-semibold text-white hover:bg-[#152060]"
        >
          <FiMaximize className="h-4 w-4" aria-hidden />
          Bu etkinliğin QR kodu
        </Link>
      </div>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0E1548] hover:bg-slate-50"
      >
        {open ? 'Daha az göster' : 'Daha fazla göster'}
        <FiChevronDown
          className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? <div className="space-y-8 pt-1">{children}</div> : null}
    </div>
  );
}
