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
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.08] transition duration-300 hover:-translate-y-1 hover:border-[#2D6AF6]/35 hover:shadow-2xl hover:shadow-[#2D6AF6]/10"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
            /etkinlikler/{event.id}
          </span>
        </div>

        <div className="border-b border-slate-100 bg-white px-5 pb-4 pt-5 sm:px-6">
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D6AF6]">Kayıt</p>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ${
                awaitingFee
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 ring-amber-200'
                  : alreadyIn
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 ring-emerald-200'
                    : event.statusLabel === 'Kayıt açık'
                      ? 'bg-gradient-to-r from-emerald-50 to-lime-50 text-emerald-700 ring-emerald-200'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 ring-blue-200'
              }`}
            >
              {alreadyIn && !awaitingFee ? <FiCheck className="h-3 w-3" aria-hidden /> : null}
              {statusLabel}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0E1548] transition group-hover:text-[#152060] sm:text-2xl">
            {event.title}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {categoryFor(event.id)} <span className="mx-1 text-slate-300">·</span>{' '}
            {dayCount > 1 ? `${dayCount} gün` : 'Tek gün'}
          </p>
        </div>

        <div className="flex flex-1 flex-col bg-white px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{event.description}</p>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2.5">
              <FiMapPin className="h-4 w-4 shrink-0 text-[#2D6AF6]" aria-hidden />
              <span className="truncate">{event.location}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <FiCalendar className="h-4 w-4 shrink-0 text-[#2D6AF6]" aria-hidden />
              <span className="truncate">{dateLabel}</span>
            </p>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiUsers className="h-3.5 w-3.5" aria-hidden />
                Kontenjan {event.capacity}
              </span>
              <span className={seatsLeft <= 10 ? 'font-medium text-amber-700' : ''}>
                {seatsLeft} kalan
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  alreadyIn && !awaitingFee
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : 'bg-gradient-to-r from-[#2D6AF6] to-[#6d9bff]'
                }`}
                style={{ width: `${Math.max(fill, taken > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>

          <span
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-md transition ${
              awaitingFee
                ? 'bg-amber-500 shadow-amber-500/20 group-hover:bg-amber-600'
                : alreadyIn
                  ? 'bg-emerald-600 shadow-emerald-600/20 group-hover:bg-emerald-700'
                  : 'bg-gradient-to-r from-[#2D6AF6] via-[#3978f7] to-[#6d9bff] shadow-lg shadow-blue-500/25 hover:brightness-105 group-hover:shadow-blue-500/35'
            }`}
          >
            {alreadyIn ? 'Kaydıma git' : 'Detayları göster'}
            <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}
