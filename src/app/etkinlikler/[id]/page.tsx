import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HomeHeader } from '@/components/home/HomeHeader';
import { RegisterForm } from '@/components/events/RegisterForm';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { getCatalogEvent, isRegistrationOpen } from '@/lib/events/catalog-store';
import { listRegistrationsForEvent, listRegistrationsForOwner, ownerKeyForRole } from '@/lib/demo/registrations-store';

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = getCatalogEvent(id);
  if (!event) notFound();

  const session = await getSiteSession();
  const taken = listRegistrationsForEvent(event.id).length;
  const seatsLeft = Math.max(0, event.capacity - taken);
  const open = isRegistrationOpen(event);
  const mine =
    session?.role === 'student'
      ? listRegistrationsForOwner(ownerKeyForRole('student')).find(
          (row) => row.eventId === event.id && row.status !== 'cancelled'
        )
      : null;

  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/etkinlikler" className="text-sm font-medium text-[#2D6AF6] hover:underline">
          ← Etkinlikler
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[#0E1548]">{event.title}</h1>
          <span className="rounded-full bg-[#e8f0ff] px-2.5 py-1 text-xs font-medium text-[#2D6AF6]">
            {mine ? 'Kayıtlısın' : event.statusLabel}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{event.location}</p>
        <p className="mt-1 text-sm text-slate-500">
          {event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{event.description}</p>
        <p className="mt-3 text-xs text-slate-500">
          Kontenjan {event.capacity} · Kalan {seatsLeft}
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#0E1548]">Program</h2>
          <ul className="mt-3 space-y-3">
            {event.days.map((day) => (
              <li key={day.id} className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3">
                <p className="font-medium text-[#0E1548]">
                  {day.label} · {day.date}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {event.activities
                    .filter((activity) => activity.dayId === day.id)
                    .map((activity) => (
                      <li key={activity.id}>
                        {activity.startsAt ? `${activity.startsAt} · ` : ''}
                        {activity.title}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          {mine ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5">
              <p className="font-medium text-[#0E1548]">Kayıt no {mine.registrationNo}</p>
              <p className="mt-1 text-sm text-slate-600">Bu etkinliğe zaten kayıtlısın.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/kayitlarim"
                  className="rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white"
                >
                  Kaydıma git
                </Link>
                <Link
                  href={`/qr?registration=${mine.id}`}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-[#0E1548]"
                >
                  QR göster
                </Link>
              </div>
            </div>
          ) : session?.role === 'student' && open && seatsLeft > 0 ? (
            <RegisterForm event={event} />
          ) : session?.role === 'student' ? (
            <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600">Kayıt şu an kapalı veya kontenjan dolu.</p>
          ) : (
            <Link
              href="/login"
              className="inline-flex rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white"
            >
              Kayıt için giriş yap
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
