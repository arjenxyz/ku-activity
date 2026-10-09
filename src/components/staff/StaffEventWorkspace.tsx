'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCheckSquare, FiUsers } from 'react-icons/fi';
import { DEMO_EVENTS } from '@/lib/demo/data';

const TOOLS = [
  {
    href: (id: string) => `/staff/check-in?eventId=${encodeURIComponent(id)}`,
    label: 'Check-in',
    hint: 'QR ile yoklama',
    icon: FiCheckSquare,
  },
  {
    href: (id: string) => `/staff/payments/cash?eventId=${encodeURIComponent(id)}`,
    label: 'Elden teslim al',
    hint: 'Nakit QR okut',
    icon: FiUsers,
  },
  {
    href: (id: string) => `/staff/payments/custody?eventId=${encodeURIComponent(id)}`,
    label: 'Kasa / yetkili devir',
    hint: 'Sorumluluk zinciri',
    icon: FiUsers,
  },
] as const;

export function StaffEventWorkspace({ eventId }: { eventId: string }) {
  const router = useRouter();
  const event = DEMO_EVENTS.find((row) => row.id === eventId) ?? null;

  if (!event) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Etkinlik bulunamadı veya sana atanmamış.</p>
        <Link href="/staff" className="text-sm font-medium text-[#2D6AF6] hover:underline">
          Etkinliklere dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => router.push('/staff')}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548]"
          aria-label="Listeye dön"
        >
          <FiArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-[#0E1548]">{event.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{event.location}</p>
        </div>
      </header>

      <p className="text-sm text-slate-500">Bu etkinlik için işlem seç.</p>

      <ul className="grid gap-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.label}>
              <Link
                href={tool.href(eventId)}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2D6AF6]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#0E1548]">{tool.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{tool.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
