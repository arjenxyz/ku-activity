import Link from 'next/link';
import { FiArrowRight, FiCalendar, FiCheck, FiMapPin, FiUsers } from 'react-icons/fi';
import type { CatalogEvent } from '@/lib/events/catalog';

const CATEGORY: Record<string, string> = {
  'abana-2027': 'Sahil',
  'tanisma-2026': 'Kampüs',
};

function categoryFor(id: string) {
  return CATEGORY[id] ?? 'Etkinlik';
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
  const seatsLeft = Math.max(0, event.capacity - taken);
  const fill = Math.min(100, Math.round((taken / Math.max(1, event.capacity)) * 100));
  const dateLabel =
    event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`;
  const dayCount = event.days.length;
  const awaitingFee = alreadyIn && needsPayment;

  const statusText = alreadyIn
    ? awaitingFee
      ? 'Ödeme bekleniyor'
      : 'Kayıtlı'
    : event.statusLabel;

  return (
    <li className="group">
      <Link
        href={`/etkinlikler/${event.id}`}
        className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-white transition hover:border-[#0E1548]/25 ${
          awaitingFee
            ? 'border-slate-300'
            : alreadyIn
              ? 'border-slate-300'
              : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[#0E1548] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
              {categoryFor(event.id)}
              <span className="mx-1.5 text-white/30">·</span>
              {dayCount > 1 ? `${dayCount} gün` : 'Tek gün'}
            </p>
          </div>
          <span
            className={`shrink-0 text-[11px] font-medium tracking-wide ${
              awaitingFee
                ? 'text-amber-200'
                : alreadyIn
                  ? 'text-emerald-200'
                  : 'text-white/80'
            }`}
          >
            {alreadyIn && !awaitingFee ? (
              <span className="inline-flex items-center gap-1">
                <FiCheck className="h-3 w-3" aria-hidden />
                {statusText}
              </span>
            ) : (
              statusText
            )}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="text-lg font-semibold tracking-tight text-[#0E1548] sm:text-xl">
            {event.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {event.description}
          </p>

          <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <div className="flex items-start gap-2.5">
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <dd>{event.location}</dd>
            </div>
            <div className="flex items-start gap-2.5">
              <FiCalendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <dd>{dateLabel}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiUsers className="h-3.5 w-3.5" aria-hidden />
                Kontenjan {event.capacity}
              </span>
              <span>{seatsLeft} kalan</span>
            </div>
            <div className="h-px overflow-hidden bg-slate-100">
              <div
                className="h-full bg-[#0E1548] transition-all"
                style={{ width: `${Math.max(fill, taken > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>

          <span className="mt-5 inline-flex items-center justify-center gap-2 border border-[#0E1548] bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white transition group-hover:bg-[#152060]">
            {alreadyIn ? 'Kaydıma git' : 'Başvur'}
            <FiArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}
