import type { ReactNode } from 'react';
import {
  FiBriefcase,
  FiCoffee,
  FiFileText,
  FiHome,
  FiMapPin,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import type { CatalogEvent } from '@/lib/events/catalog';
import {
  COST_BEARER_LABELS,
  MEAL_SLOT_LABELS,
  emptyPlanning,
  formatFeeTry,
} from '@/lib/events/catalog';

function Block({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: IconType;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f0ff] text-[#2D6AF6]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-base font-semibold text-[#0E1548] sm:text-lg">{title}</h2>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-3.5 text-sm leading-relaxed text-slate-700 sm:px-4">
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
    <div className="space-y-7">
      {hasPricing ? (
        <Block title="Ücret ve dahil olanlar" icon={FiBriefcase}>
          <p className="text-lg font-semibold text-[#0E1548]">
            {formatFeeTry(pricing.feeAmount)}
          </p>
          {pricing.feeNotes ? <p className="mt-1.5 text-slate-600">{pricing.feeNotes}</p> : null}
          {pricing.includes.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {pricing.includes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#2D6AF6]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Block>
      ) : null}

      {hasTransport ? (
        <Block title="Ulaşım" icon={FiTruck}>
          <p className="font-medium text-[#0E1548]">
            {transport.provided
              ? `${transport.mode || 'Ulaşım'} organizasyon tarafından sağlanır`
              : 'Organizasyon ulaşım sağlamaz'}
          </p>
          {transport.durationText ? (
            <p className="mt-1.5 text-slate-600">Süre: {transport.durationText}</p>
          ) : null}
          {transport.departurePlace || transport.arrivalPlace ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-slate-600">
              <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" aria-hidden />
              <span>
                {[transport.departurePlace, transport.arrivalPlace].filter(Boolean).join(' → ')}
              </span>
            </p>
          ) : null}
          {transport.feeAmount !== null || transport.feeBearer !== 'none' ? (
            <p className="mt-1.5 text-slate-600">
              Ücret: {formatFeeTry(transport.feeAmount)} · {COST_BEARER_LABELS[transport.feeBearer]}
            </p>
          ) : null}
          {transport.notes ? <p className="mt-2 text-slate-600">{transport.notes}</p> : null}
        </Block>
      ) : null}

      {hasAccommodation ? (
        <Block title="Konaklama" icon={FiHome}>
          <p className="font-medium text-[#0E1548]">
            {accommodation.provided
              ? accommodation.placeName || 'Konaklama sağlanır'
              : 'Organizasyon konaklama sağlamaz'}
          </p>
          {accommodation.nights != null ? (
            <p className="mt-1.5 text-slate-600">{accommodation.nights} gece</p>
          ) : null}
          {accommodation.roomInfo ? (
            <p className="mt-1.5 text-slate-600">{accommodation.roomInfo}</p>
          ) : null}
          {accommodation.checkInText || accommodation.checkOutText ? (
            <p className="mt-1.5 text-slate-600">
              {[
                accommodation.checkInText && `Giriş ${accommodation.checkInText}`,
                accommodation.checkOutText && `Çıkış ${accommodation.checkOutText}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {accommodation.feeBearer !== 'none' ? (
            <p className="mt-1.5 text-slate-600">
              Karşılayan: {COST_BEARER_LABELS[accommodation.feeBearer]}
            </p>
          ) : null}
          {accommodation.notes ? (
            <p className="mt-2 text-slate-600">{accommodation.notes}</p>
          ) : null}
        </Block>
      ) : null}

      {meals.length > 0 ? (
        <Block title="Yemek planı" icon={FiCoffee}>
          <ul className="space-y-3">
            {event.days.map((day, dayIndex) => {
              const dayMeals = meals.filter((meal) => meal.dayIndex === dayIndex);
              if (!dayMeals.length) return null;
              return (
                <li key={day.id}>
                  <p className="font-medium text-[#0E1548]">
                    {day.label}
                    <span className="ml-1.5 font-normal text-slate-500">{day.date}</span>
                  </p>
                  <ul className="mt-1.5 space-y-1 text-slate-600">
                    {dayMeals.map((meal, idx) => (
                      <li key={`${day.id}-${meal.slot}-${idx}`} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-300" aria-hidden />
                        <span>
                          <span className="font-medium text-slate-700">
                            {MEAL_SLOT_LABELS[meal.slot]}
                          </span>
                          {meal.menu ? ` · ${meal.menu}` : ''}
                          {' · '}
                          {COST_BEARER_LABELS[meal.providedBy]}
                          {meal.notes ? ` (${meal.notes})` : ''}
                        </span>
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
        <Block title="Ekip" icon={FiUsers}>
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
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-amber-900">
              Acil: {team.emergencyContact}
            </p>
          ) : null}
        </Block>
      ) : null}

      {sponsors.length > 0 ? (
        <Block title="Sponsorlar" icon={FiBriefcase}>
          <ul className="space-y-1.5">
            {sponsors.map((sponsor) => (
              <li key={sponsor.name}>
                {sponsor.url ? (
                  <a
                    href={sponsor.url}
                    className="font-medium text-[#2D6AF6] hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sponsor.name}
                  </a>
                ) : (
                  <span className="font-medium text-[#0E1548]">{sponsor.name}</span>
                )}
                {sponsor.contribution ? (
                  <span className="text-slate-600"> · {sponsor.contribution}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {hasRequirements ? (
        <Block title="Katılım bilgileri" icon={FiFileText}>
          {meetingPoint ? (
            <p className="flex items-start gap-1.5">
              <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" aria-hidden />
              <span>
                <span className="font-medium text-[#0E1548]">Buluşma:</span> {meetingPoint}
              </span>
            </p>
          ) : null}
          {requirements.documents.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {requirements.documents.map((doc) => (
                <li key={doc} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#2D6AF6]" aria-hidden />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {requirements.equipment ? (
            <p className="mt-2">
              <span className="font-medium text-[#0E1548]">Ekipman:</span> {requirements.equipment}
            </p>
          ) : null}
          {requirements.dressCode ? (
            <p className="mt-1">
              <span className="font-medium text-[#0E1548]">Kıyafet:</span> {requirements.dressCode}
            </p>
          ) : null}
          {requirements.otherNotes ? (
            <p className="mt-2 text-slate-600">{requirements.otherNotes}</p>
          ) : null}
        </Block>
      ) : null}
    </div>
  );
}
