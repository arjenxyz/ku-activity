'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiEdit2,
  FiFileText,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi';
import type { CatalogEvent } from '@/lib/events/catalog';

type AdminEvent = CatalogEvent & { registeredCount?: number };

const TOOLS = [
  {
    href: (id: string) => `/admin/participants/${id}`,
    label: 'Katılımcılar',
    hint: 'Kayıt listesi ve ödemeler',
    icon: FiUsers,
  },
  {
    href: (id: string) => `/admin/payments/reviews?eventId=${encodeURIComponent(id)}`,
    label: 'Havale incelemeleri',
    hint: 'Dekont onay kuyruğu',
    icon: FiClipboard,
  },
  {
    href: (id: string) => `/admin/check-in?eventId=${encodeURIComponent(id)}`,
    label: 'Check-in',
    hint: 'QR ile yoklama',
    icon: FiCheckSquare,
  },
  {
    href: (id: string) => `/admin/reports?eventId=${encodeURIComponent(id)}`,
    label: 'Raporlar',
    hint: 'Özet ve dışa aktarma',
    icon: FiFileText,
  },
  {
    href: (id: string) => `/admin/events/${id}/edit`,
    label: 'Düzenle',
    hint: 'Etkinlik ayarları',
    icon: FiEdit2,
  },
] as const;

export function AdminEventWorkspace({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/admin/events');
      const payload = (await response.json().catch(() => null)) as { events?: AdminEvent[] } | null;
      setEvent(payload?.events?.find((item) => item.id === eventId) ?? null);
      setReady(true);
    })();
  }, [eventId]);

  if (ready && !event) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Etkinlik bulunamadı.</p>
        <Link href="/admin/events" className="text-sm font-medium text-[#2D6AF6] hover:underline">
          Etkinliklere dön
        </Link>
      </div>
    );
  }

  const dateLabel =
    event && (event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`);

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => router.push('/admin/events')}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548] hover:bg-slate-50"
          aria-label="Etkinlik listesine dön"
        >
          <FiArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-[#0E1548]">
            {event?.title ?? '…'}
          </h1>
          {event ? (
            <p className="mt-1 space-y-0.5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5 truncate">
                <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" />
                {event.location}
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <FiCalendar className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" />
                {dateLabel}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Yükleniyor…</p>
          )}
        </div>
      </header>

      <p className="text-sm text-slate-500">Bu etkinlik için işlem seç.</p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.label}>
              <Link
                href={tool.href(eventId)}
                className="flex h-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#2D6AF6]/30 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2D6AF6]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
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
