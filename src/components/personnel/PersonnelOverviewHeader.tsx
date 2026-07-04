'use client';

import { FiBriefcase } from 'react-icons/fi';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { formatString } from '@/lib/strings/format';

type Props = {
  firstName?: string;
  fullName?: string;
  position?: string;
  photoUrl?: string | null;
};

function timeGreeting(strings: {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
}) {
  const hour = new Date().getHours();
  if (hour < 12) return strings.greetingMorning;
  if (hour < 18) return strings.greetingAfternoon;
  return strings.greetingEvening;
}

export function PersonnelOverviewHeader({ firstName, fullName, position, photoUrl }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelOverviewHeader');
  const greeting = timeGreeting(strings);
  const displayName = fullName ?? strings.defaultName;
  const greetingLine = firstName
    ? formatString(strings.greetingWithName, { greeting, firstName })
    : greeting;

  return (
    <section
      aria-label={strings.sectionAriaLabel}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl shadow-[#0E1548]/25 ring-1 ring-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0E1548] via-[#152060] to-indigo-900" />
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(96,165,250,0.45) 0%, transparent 45%), radial-gradient(circle at 10% 85%, rgba(129,140,248,0.3) 0%, transparent 42%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />

      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 flex justify-center sm:justify-start">
            <BrandLockup
              size="sm"
              className="items-center sm:items-start text-center sm:text-left"
              iconClassName="ring-2 ring-white/25 shadow-md"
              subtitle={strings.panelSubtitle}
              subtitleClassName="text-[11px] font-medium tracking-wide text-blue-100/90 uppercase"
            />
          </div>
          <LanguageSwitch variant="compact" tone="onDark" className="shrink-0 mt-0.5" />
        </div>

        <div className="my-4 sm:my-5 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex items-center gap-4 sm:gap-5">
          <div className="min-w-0 flex-1">
            <p className="inline-flex max-w-full items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur-sm">
              <span className="truncate">{greetingLine}</span>
            </p>

            <h1 className="mt-3 text-[1.65rem] sm:text-3xl font-bold text-white leading-tight tracking-tight break-words">
              {displayName}
            </h1>

            {position ? (
              <p className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white/8 px-2.5 py-1 text-sm text-blue-50/95">
                <FiBriefcase className="h-3.5 w-3.5 shrink-0 opacity-75" aria-hidden />
                <span className="truncate">{position}</span>
              </p>
            ) : null}
          </div>

          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-[1.1rem] bg-gradient-to-br from-white/35 via-white/10 to-transparent blur-[2px]"
              aria-hidden
            />
            <EmployeeAvatar
              name={displayName}
              photoUrl={photoUrl}
              size="xl"
              className="!rounded-2xl relative ring-2 ring-white/35 shadow-2xl shadow-black/20"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
