import Link from 'next/link';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiClock,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi';
import { EventPlanningSections } from '@/components/events/EventPlanningSections';
import { JoinApplyButton } from '@/components/events/JoinApplyButton';
import { RegisteredEventExtras } from '@/components/events/RegisteredEventExtras';
import type { CatalogEvent } from '@/lib/events/catalog';
import type { DemoRegistration } from '@/lib/demo/registrations-store';
import { presentRegistration } from '@/lib/registrations/present';

const THEMES: Record<string, { band: string; glow: string; mark: string }> = {
  'abana-2027': {
    band: 'from-[#0E1548] via-[#1a3a7a] to-[#2D6AF6]',
    glow: 'bg-sky-300/35',
    mark: 'Sahil',
  },
  'tanisma-2026': {
    band: 'from-[#0E1548] via-[#152060] to-[#3d5a9e]',
    glow: 'bg-sky-200/30',
    mark: 'Kampüs',
  },
};

function themeFor(id: string) {
  return (
    THEMES[id] ?? {
      band: 'from-[#0E1548] to-[#2D6AF6]',
      glow: 'bg-sky-200/30',
      mark: 'Etkinlik',
    }
  );
}

type Props = {
  event: CatalogEvent;
  taken: number;
  seatsLeft: number;
  registrationOpen: boolean;
  mine: DemoRegistration | null;
  isStudent: boolean;
  studentNo?: string | null;
};

export function StudentEventDetail({
  event,
  taken,
  seatsLeft,
  registrationOpen,
  mine,
  isStudent,
  studentNo = null,
}: Props) {
  const theme = themeFor(event.id);
  const dateLabel =
    event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`;
  const dayCount = event.days.length;
  const presentedMine = mine ? presentRegistration(mine) : null;

  return (
    <div className={`mx-auto w-full max-w-6xl ${mine ? '' : 'pb-16 sm:pb-20'}`}>
      <Link
        href="/etkinlikler"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D6AF6] hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" aria-hidden />
        Etkinlikler
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.08]">
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
        <div className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e8f0ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">
                {theme.mark}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                {dayCount > 1 ? `${dayCount} gün` : 'Tek gün'}
              </span>
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ${
                  mine
                    ? presentedMine?.needsPayment
                      ? presentedMine.paymentStatus === 'claimed'
                        ? 'bg-amber-50 text-amber-800 ring-amber-200'
                        : presentedMine.paymentStatus === 'rejected'
                          ? 'bg-red-50 text-red-700 ring-red-200'
                          : 'bg-amber-50 text-amber-800 ring-amber-200'
                      : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : event.statusLabel === 'Kayıt açık'
                      ? 'bg-gradient-to-r from-emerald-50 to-lime-50 text-emerald-700 ring-emerald-200'
                      : 'bg-blue-50 text-blue-700 ring-blue-200'
                }`}
              >
                {mine && !presentedMine?.needsPayment ? (
                  <FiCheck className="h-3.5 w-3.5" aria-hidden />
                ) : null}
                {mine
                  ? presentedMine?.needsPayment
                    ? presentedMine.statusLabel
                    : 'Kayıtlısın'
                  : event.statusLabel}
              </span>
            </div>

            <h1 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-[#0E1548] sm:text-3xl">
              {event.title}
            </h1>

            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              <li className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-600">
                <FiMapPin className="h-4 w-4 shrink-0 text-[#2D6AF6]" aria-hidden />
                <span className="min-w-0 truncate">{event.location}</span>
              </li>
              <li className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-600">
                <FiCalendar className="h-4 w-4 shrink-0 text-[#2D6AF6]" aria-hidden />
                <span className="min-w-0 truncate">{dateLabel}</span>
              </li>
              <li className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-sm text-emerald-800">
                <FiUsers className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span className="min-w-0 truncate">Kontenjan {event.capacity} · {seatsLeft} kalan</span>
              </li>
            </ul>
          </div>
        </div>

        {mine ? (
          <RegisteredEventExtras
            eventId={event.id}
            registrationId={mine.id}
            registrationNo={mine.registrationNo}
            studentNo={studentNo}
            eventTitle={event.title}
            location={event.location}
            dateLabel={dateLabel}
            passengerName={mine.ownerName}
            needsPayment={presentedMine?.needsPayment}
            feeLabel={presentedMine?.feeLabel}
            paymentIban={presentedMine?.paymentIban}
            paymentCode={presentedMine?.paymentCode}
            cashPaymentEnabled={presentedMine?.cashPaymentEnabled}
            cashContactName={presentedMine?.cashContactName}
            cashContactNote={presentedMine?.cashContactNote}
            paymentStatus={presentedMine?.paymentStatus}
            paymentNote={presentedMine?.paymentNote}
            openClaimId={presentedMine?.openClaimId}
          >
            <EventDetailBody event={event} />
            <div className="border-t border-slate-100 pt-4">
              <Link
                href="/kayitlarim"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0E1548]"
              >
                Kaydıma git
              </Link>
            </div>
          </RegisteredEventExtras>
        ) : (
          <div className="bg-gradient-to-b from-white to-slate-50 px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
            <main className="mx-auto min-w-0 max-w-4xl space-y-8">
              <EventDetailBody event={event} />
            </main>
          </div>
        )}
      </article>
      {!mine ? (
        <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
          <JoinApplyButton
            event={event}
            isStudent={isStudent}
            registrationOpen={registrationOpen}
            seatsLeft={seatsLeft}
            edgeVariant
          />
        </div>
      ) : null}
    </div>
  );
}

function EventDetailBody({ event }: { event: CatalogEvent }) {
  return (
    <>
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D6AF6]">Hakkında</p>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{event.description}</p>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-[#0E1548]">Program akışı</h2>
          <span className="text-xs text-slate-400">{event.days.length} gün</span>
        </div>
        <ol className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:left-[0.95rem] before:top-2 before:w-px before:bg-slate-200">
          {event.days.map((day, index) => {
            const dayActivities = event.activities.filter(
              (activity) => activity.dayId === day.id
            );
            return (
              <li key={day.id} className="relative pl-10">
                <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#2D6AF6]/25 bg-[#e8f0ff] text-xs font-semibold text-[#2D6AF6]">
                  {index + 1}
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm shadow-slate-900/[0.03] sm:px-4">
                  <p className="text-sm font-semibold text-[#0E1548]">
                    {day.label}
                    <span className="ml-2 font-normal text-slate-500">{day.date}</span>
                  </p>
                  {dayActivities.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">Bu gün için etkinlik yok.</p>
                  ) : (
                    <ul className="mt-2.5 space-y-2">
                      {dayActivities.map((activity) => (
                        <li
                          key={activity.id}
                          className="flex items-start gap-2.5 text-sm text-slate-700"
                        >
                          <span className="mt-0.5 inline-flex min-w-[3.25rem] items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#0E1548] ring-1 ring-slate-200">
                            <FiClock className="h-3 w-3 text-[#2D6AF6]" aria-hidden />
                            {activity.startsAt || '—'}
                          </span>
                          <span className="min-w-0 leading-snug">{activity.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <EventPlanningSections event={event} />
    </>
  );
}
