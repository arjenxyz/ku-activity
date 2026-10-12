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

  const statusLabel = alreadyIn
    ? awaitingFee
      ? 'Ödeme bekleniyor'
      : 'Kayıtlısın'
    : event.statusLabel;

  return (
    <li className="group">
      <Link
        href={`/etkinlikler/${event.id}`}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] ring-1 ring-black/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[#2D6AF6]/30 hover:shadow-md hover:shadow-slate-900/[0.06]"
      >
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#f7fbff] via-white to-[#eef4ff] px-4 pb-4 pt-4 sm:px-5">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#2D6AF6]/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <p className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
              {categoryFor(event.id)}
              <span className="mx-1.5 text-slate-300">·</span>
              {dayCount > 1 ? `${dayCount} gün` : 'Tek gün'}
            </p>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ${
                awaitingFee
                  ? 'bg-amber-50 text-amber-800 ring-amber-100'
                  : alreadyIn
                    ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
                    : 'bg-white text-[#0E1548] ring-slate-200/80'
              }`}
            >
              {alreadyIn && !awaitingFee ? <FiCheck className="h-3 w-3" aria-hidden /> : null}
              {statusLabel}
            </span>
          </div>
          <h2 className="relative mt-4 text-xl font-bold tracking-tight text-[#0E1548] transition group-hover:text-[#152060]">
            {event.title}
          </h2>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{event.description}</p>

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
              <span className="inline-flex items-center gap-1.5">
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
                  alreadyIn && !awaitingFee ? 'bg-emerald-500' : 'bg-[#2D6AF6]'
                }`}
                style={{ width: `${Math.max(fill, taken > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>

          <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition group-hover:bg-[#152060]">
            {alreadyIn ? 'Kaydıma git' : 'Başvur'}
            <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}
