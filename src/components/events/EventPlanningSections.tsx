import type { ReactNode } from 'react';
import type { CatalogEvent } from '@/lib/events/catalog';
import {
  COST_BEARER_LABELS,
  MEAL_SLOT_LABELS,
  emptyPlanning,
  formatFeeTry,
} from '@/lib/events/catalog';

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-[#0E1548]">{title}</h2>
      <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-700">
        {children}
      </div>
    </section>
  );
}

export function EventPlanningSections({ event }: { event: CatalogEvent }) {
  const planning = event.planning ?? emptyPlanning();
  const { pricing, transport, accommodation, meals, team, sponsors, requirements, meetingPoint } =
    planning;

  const hasPricing =
    pricing.feeAmount !== null || pricing.feeNotes || pricing.includes.length > 0;
  const hasTransport =
    transport.provided ||
    transport.mode ||
    transport.departurePlace ||
    transport.arrivalPlace ||
    transport.durationText ||
    transport.notes;
  const hasAccommodation =
    accommodation.provided ||
    accommodation.placeName ||
    accommodation.roomInfo ||
    accommodation.notes;
  const hasTeam =
    team.projectAdvisor.name ||
    team.organizers.length > 0 ||
    team.emergencyContact;
  const hasRequirements =
    meetingPoint ||
    requirements.documents.length > 0 ||
    requirements.equipment ||
    requirements.dressCode ||
    requirements.otherNotes;

  return (
    <>
      {hasPricing ? (
        <Block title="Ücret ve dahil olanlar">
          <p className="font-medium text-[#0E1548]">{formatFeeTry(pricing.feeAmount)}</p>
          {pricing.feeNotes ? <p className="mt-1 text-slate-600">{pricing.feeNotes}</p> : null}
          {pricing.includes.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1">
              {pricing.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </Block>
      ) : null}

      {hasTransport ? (
        <Block title="Ulaşım">
          <p>
            {transport.provided
              ? `${transport.mode || 'Ulaşım'} organizasyon tarafından sağlanır`
              : 'Organizasyon ulaşım sağlamaz'}
          </p>
          {transport.durationText ? <p className="mt-1">Süre: {transport.durationText}</p> : null}
          {transport.departurePlace || transport.arrivalPlace ? (
            <p className="mt-1">
              {[transport.departurePlace, transport.arrivalPlace].filter(Boolean).join(' → ')}
            </p>
          ) : null}
          {transport.feeAmount !== null || transport.feeBearer !== 'none' ? (
            <p className="mt-1">
              Ücret: {formatFeeTry(transport.feeAmount)} · {COST_BEARER_LABELS[transport.feeBearer]}
            </p>
          ) : null}
          {transport.notes ? <p className="mt-2 text-slate-600">{transport.notes}</p> : null}
        </Block>
      ) : null}

      {hasAccommodation ? (
        <Block title="Konaklama">
          <p>
            {accommodation.provided
              ? accommodation.placeName || 'Konaklama sağlanır'
              : 'Organizasyon konaklama sağlamaz'}
          </p>
          {accommodation.nights != null ? (
            <p className="mt-1">{accommodation.nights} gece</p>
          ) : null}
          {accommodation.roomInfo ? <p className="mt-1">{accommodation.roomInfo}</p> : null}
          {accommodation.checkInText || accommodation.checkOutText ? (
            <p className="mt-1">
              {[accommodation.checkInText && `Giriş ${accommodation.checkInText}`, accommodation.checkOutText && `Çıkış ${accommodation.checkOutText}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {accommodation.feeBearer !== 'none' ? (
            <p className="mt-1">Karşılayan: {COST_BEARER_LABELS[accommodation.feeBearer]}</p>
          ) : null}
          {accommodation.notes ? <p className="mt-2 text-slate-600">{accommodation.notes}</p> : null}
        </Block>
      ) : null}

      {meals.length > 0 ? (
        <Block title="Yemek planı">
          <ul className="space-y-3">
            {event.days.map((day, dayIndex) => {
              const dayMeals = meals.filter((meal) => meal.dayIndex === dayIndex);
              if (!dayMeals.length) return null;
              return (
                <li key={day.id}>
                  <p className="font-medium text-[#0E1548]">
                    {day.label} · {day.date}
                  </p>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    {dayMeals.map((meal, idx) => (
                      <li key={`${day.id}-${meal.slot}-${idx}`}>
                        {MEAL_SLOT_LABELS[meal.slot]}
                        {meal.menu ? ` · ${meal.menu}` : ''}
                        {' · '}
                        {COST_BEARER_LABELS[meal.providedBy]}
                        {meal.notes ? ` (${meal.notes})` : ''}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : null}

      {hasTeam ? (
        <Block title="Ekip">
          {team.projectAdvisor.name ? (
            <p>
              <span className="font-medium text-[#0E1548]">Danışman:</span>{' '}
              {team.projectAdvisor.name}
              {team.projectAdvisor.title ? ` · ${team.projectAdvisor.title}` : ''}
              {team.projectAdvisor.contact ? ` · ${team.projectAdvisor.contact}` : ''}
            </p>
          ) : null}
          {team.organizers.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {team.organizers.map((org) => (
                <li key={`${org.name}-${org.role}`}>
                  {org.name}
                  {org.role ? ` · ${org.role}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          {team.emergencyContact ? (
            <p className="mt-2">Acil: {team.emergencyContact}</p>
          ) : null}
        </Block>
      ) : null}

      {sponsors.length > 0 ? (
        <Block title="Sponsorlar">
          <ul className="space-y-1">
            {sponsors.map((sponsor) => (
              <li key={sponsor.name}>
                {sponsor.url ? (
                  <a href={sponsor.url} className="font-medium text-[#2D6AF6] hover:underline" target="_blank" rel="noreferrer">
                    {sponsor.name}
                  </a>
                ) : (
                  <span className="font-medium text-[#0E1548]">{sponsor.name}</span>
                )}
                {sponsor.contribution ? ` · ${sponsor.contribution}` : ''}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {hasRequirements ? (
        <Block title="Katılım bilgileri">
          {meetingPoint ? <p>Buluşma: {meetingPoint}</p> : null}
          {requirements.documents.length > 0 ? (
            <ul className="mt-2 list-inside list-disc">
              {requirements.documents.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          ) : null}
          {requirements.equipment ? <p className="mt-2">Ekipman: {requirements.equipment}</p> : null}
          {requirements.dressCode ? <p className="mt-1">Kıyafet: {requirements.dressCode}</p> : null}
          {requirements.otherNotes ? (
            <p className="mt-2 text-slate-600">{requirements.otherNotes}</p>
          ) : null}
        </Block>
      ) : null}
    </>
  );
}
