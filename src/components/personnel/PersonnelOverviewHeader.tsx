'use client';

import { FiBriefcase } from 'react-icons/fi';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { PersonnelNotificationsBell } from '@/components/personnel/PersonnelNotificationsBell';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';

type Props = {
  firstName?: string;
  fullName?: string;
  position?: string;
  photoUrl?: string | null;
};

export function PersonnelOverviewHeader({ fullName, position, photoUrl }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelOverviewHeader');
  const displayName = fullName ?? strings.defaultName;

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
        <div className="flex items-center justify-between gap-3">
          <BrandLockup
            size="sm"
            layout="inline"
            align="start"
            className="min-w-0 shrink"
            iconClassName="ring-2 ring-white/25 shadow-md shrink-0"
            subtitle={strings.panelSubtitle}
            subtitleClassName="text-[10px] font-semibold tracking-[0.14em] text-blue-100/85 uppercase leading-none"
          />
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitch variant="compact" tone="onDark" />
            <PersonnelNotificationsBell tone="onDark" />
          </div>
        </div>

        <div className="mt-4 sm:mt-5 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="mt-4 sm:mt-5 flex items-center gap-3.5 sm:gap-4">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/30 via-white/10 to-transparent blur-[1px]"
              aria-hidden
            />
            <EmployeeAvatar
              name={displayName}
              photoUrl={photoUrl}
              size="lg"
              className="!rounded-2xl relative h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem] ring-2 ring-white/30 shadow-lg shadow-black/25"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight break-words">
              {displayName}
            </h1>

            {position ? (
              <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-100/90">
                <FiBriefcase className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="truncate">{position}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
