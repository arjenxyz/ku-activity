'use client';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';

type Props = {
  firstName?: string;
  fullName?: string;
  position?: string;
  photoUrl?: string | null;
};

export function PersonnelOverviewHeader({ firstName, fullName, position, photoUrl }: Props) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  })();

  const displayName = fullName ?? 'Personel';

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg shadow-blue-900/15">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <BrandLockup
          size="sm"
          className="items-start text-left mb-4"
          iconClassName="ring-2 ring-white/25 shadow-md"
          subtitle="Personel paneli"
          subtitleClassName="text-[11px] font-medium text-blue-100/90"
        />

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-blue-100">
              {greeting}
              {firstName ? `, ${firstName}` : ''}
            </p>
            <h1 className="mt-1 text-2xl sm:text-[1.65rem] font-bold text-white leading-tight truncate">
              {displayName}
            </h1>
            {position && (
              <p className="mt-1.5 text-sm text-blue-100/85 truncate">{position}</p>
            )}
          </div>

          <EmployeeAvatar
            name={displayName}
            photoUrl={photoUrl}
            size="lg"
            className="!rounded-2xl ring-2 ring-white/30 shadow-lg shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
