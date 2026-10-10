import Link from 'next/link';
import { FiArrowRight, FiCalendar, FiCheck, FiMapPin, FiUsers } from 'react-icons/fi';
import type { CatalogEvent } from '@/lib/events/catalog';

const THEMES: Record<string, { band: string; glow: string; mark: string }> = {
  'abana-2027': {
    band: 'from-[#0E1548] via-[#1a3a7a] to-[#2D6AF6]',
    glow: 'bg-sky-300/40',
    mark: 'Sahil',
  },
  'tanisma-2026': {
    band: 'from-[#0E1548] via-[#152060] to-[#3d5a9e]',
    glow: 'bg-indigo-200/35',
    mark: 'Kampüs',
  },
};

function themeFor(id: string) {
  return (
    THEMES[id] ?? {
      band: 'from-[#0E1548] to-[#2D6AF6]',
      glow: 'bg-blue-200/30',
      mark: 'Etkinlik',
    }
  );
}

export function EventCard({
  event,
  alreadyIn,
  taken,
  needsPayment = false,
}: {
  event: CatalogEvent;
  alreadyIn: boolean;
  taken: number;
  needsPayment?: boolean;
}) {
  const theme = themeFor(event.id);
  const seatsLeft = Math.max(0, event.capacity - taken);
  const fill = Math.min(100, Math.round((taken / Math.max(1, event.capacity)) * 100));
  const dateLabel =
    event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`;
  const dayCount = event.days.length;
  const awaitingFee = alreadyIn && needsPayment;

  return (
    <li className="group">
      <Link
        href={`/etkinlikler/${event.id}`}
        className={`relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border bg-white/85 shadow-sm shadow-slate-900/[0.04] transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/[0.08] ${
          awaitingFee
            ? 'border-amber-200/90 ring-1 ring-amber-100'
            : alreadyIn
              ? 'border-emerald-200/90 ring-1 ring-emerald-100'
              : 'border-slate-200/80 hover:border-[#2D6AF6]/35'
        }`}
      >
        <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${theme.band}`}>
          <div className={`absolute -right-6 -top-8 h-32 w-32 rounded-full ${theme.glow} blur-2xl`} />
          <div className={`absolute -bottom-10 left-8 h-28 w-28 rounded-full ${theme.glow} blur-2xl`} />
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="relative flex h-full items-start justify-between p-4">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
              {theme.mark}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
                awaitingFee
                  ? 'bg-[#E8770A]/95 text-white'
                  : alreadyIn
                    ? 'bg-emerald-400/95 text-[#0B3D2E]'
                    : 'bg-white/95 text-[#0E1548]'
              }`}
            >
              {alreadyIn && !awaitingFee ? <FiCheck className="h-3.5 w-3.5" aria-hidden /> : null}
              {alreadyIn ? (awaitingFee ? 'Bekleniyor' : 'Kayıtlısın') : event.statusLabel}
            </span>
          </div>
          <p className="absolute bottom-3 left-4 text-xs font-medium text-white/80">
            {dayCount > 1 ? `${dayCount} gün` : 'Tek gün'}
          </p>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <h2 className="text-xl font-semibold tracking-tight text-[#0E1548] transition group-hover:text-[#152060]">
            {event.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{event.description}</p>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-start gap-2">
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6AF6]" aria-hidden />
              <span>{event.location}</span>
            </p>
            <p className="flex items-start gap-2">
              <FiCalendar className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6AF6]" aria-hidden />
              <span>{dateLabel}</span>
            </p>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <FiUsers className="h-3.5 w-3.5" aria-hidden />
                Kontenjan {event.capacity}
              </span>
              <span className={seatsLeft <= 10 ? 'font-medium text-amber-700' : ''}>
                {seatsLeft} kalan
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  alreadyIn ? 'bg-emerald-500' : 'bg-[#2D6AF6]'
                }`}
                style={{ width: `${Math.max(fill, taken > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>

          <span
            className={`mt-5 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition ${
              alreadyIn
                ? 'bg-[#0E1548] group-hover:bg-[#152060]'
                : 'bg-emerald-600 shadow-emerald-600/20 group-hover:bg-emerald-700'
            }`}
          >
            {alreadyIn ? 'Kaydıma git' : 'Başvur'}
            <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}
