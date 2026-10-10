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
  const fill = Math.min(100, Math.round((taken / Math.max(1, event.capacity)) * 100));
  const dayCount = event.days.length;
  const presentedMine = mine ? presentRegistration(mine) : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/etkinlikler"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D6AF6] hover:underline"
      >
        <FiArrowLeft className="h-4 w-4" aria-hidden />
        Etkinlikler
      </Link>

      <article className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04]">
        <div className={`relative overflow-hidden bg-gradient-to-br ${theme.band} px-5 py-6 text-white sm:px-6 sm:py-7`}>
          <div className={`absolute -right-8 -top-10 h-40 w-40 rounded-full ${theme.glow} blur-3xl`} />
          <div className={`absolute -bottom-12 left-10 h-36 w-36 rounded-full ${theme.glow} blur-3xl`} />
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90">
                {theme.mark}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium text-white/85">
                {dayCount > 1 ? `${dayCount} gün` : 'Tek gün'}
              </span>
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  mine
                    ? presentedMine?.needsPayment
                      ? 'bg-[#E8770A]/95 text-white'
                      : 'bg-emerald-400/95 text-[#0B3D2E]'
                    : 'bg-white/95 text-[#0E1548]'
                }`}
              >
                {mine && !presentedMine?.needsPayment ? (
                  <FiCheck className="h-3.5 w-3.5" aria-hidden />
                ) : null}
                {mine
                  ? presentedMine?.needsPayment
                    ? 'Bekleniyor'
                    : 'Kayıtlısın'
                  : event.statusLabel}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              {event.title}
            </h1>

            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li className="flex items-center gap-2">
                <FiMapPin className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
                <span>{event.location}</span>
              </li>
              <li className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
                <span>{dateLabel}</span>
              </li>
              <li className="flex items-center gap-2">
                <FiUsers className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
                <span>
                  Kontenjan {event.capacity} · Kalan {seatsLeft}
                </span>
              </li>
            </ul>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-white/70">
                <span>Doluluk</span>
                <span>
                  {taken}/{event.capacity}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white/90"
                  style={{ width: `${fill}%` }}
                />
              </div>
            </div>
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
          <div className="space-y-8 px-5 py-6 sm:px-6">
            <EventDetailBody event={event} />
            <section className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-semibold text-[#0E1548]">Katılım başvurusu</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tek tuşla başvurun; ücret varsa ödemeyi Etkinliklerim’den tamamlayın.
              </p>
              <div className="mt-4">
                <JoinApplyButton
                  event={event}
                  isStudent={isStudent}
                  registrationOpen={registrationOpen}
                  seatsLeft={seatsLeft}
                />
              </div>
            </section>
          </div>
        )}
      </article>
    </div>
  );
}

function EventDetailBody({ event }: { event: CatalogEvent }) {
  return (
    <>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hakkında</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{event.description}</p>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0E1548]">Program</h2>
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
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-3 sm:px-4">
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
