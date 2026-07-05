'use client';

type IconProps = { className?: string };

const STROKE = 1.75;

/** Özet — panel grid */
export function NavIconHome({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="13" y="10.5" width="7.5" height="10" rx="2" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M6.25 16.25h2.5M6.25 18.75h4" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
    </svg>
  );
}

/** Yevmiye — takvim + kayıt */
export function NavIconWork({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <rect x="7" y="12" width="3" height="3" rx="0.75" fill="currentColor" fillOpacity="0.85" />
      <rect x="12" y="12" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="7" y="16.5" width="3" height="3" rx="0.75" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M13.5 17.25h2.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
    </svg>
  );
}

/** Finans — cüzdan */
export function NavIconFinance({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 8.5h13a2 2 0 012 2v7a2 2 0 01-2 2h-13a2 2 0 01-2-2v-7a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M4.5 11.5h15" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="16.5" cy="14.5" r="1.35" fill="currentColor" />
      <path
        d="M7.5 6.5v2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M6 8.5h3"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Menü — katmanlı panel */
export function NavIconMenu({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="4.5" rx="1.5" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="4" y="11.25" width="16" height="4.5" rx="1.5" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="4" y="17.5" width="10" height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="18.5" cy="18.75" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** Yoklama — QR tarama çerçevesi */
export function NavIconQr({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4H5.5A1.5 1.5 0 004 5.5V7M17 4h1.5A1.5 1.5 0 0120 5.5V7M4 17v1.5A1.5 1.5 0 005.5 20H7M17 20h1.5A1.5 1.5 0 0020 17.5V17"
        stroke="currentColor"
        strokeWidth={STROKE + 0.25}
        strokeLinecap="round"
      />
      <rect x="7.5" y="7.5" width="3.5" height="3.5" rx="0.75" fill="currentColor" />
      <rect x="13" y="7.5" width="3.5" height="3.5" rx="0.75" stroke="currentColor" strokeWidth={STROKE} />
      <rect x="7.5" y="13" width="3.5" height="3.5" rx="0.75" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M13.75 13.75h2.5v2.5M13 17h1.75v1.75M16.25 16.25h1.75v1.75" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
    </svg>
  );
}

/** Mesai — saat + artı */
export function NavIconMesai({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M12 8v4.25l2.75 1.75" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 5.5l1 1" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="19.25" cy="4.75" r="1.1" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
}

/** Asgari — kalkan + onay */
export function NavIconAsgari({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5l6.5 2.75v5.25c0 4.1-2.75 6.85-6.5 8.5-3.75-1.65-6.5-4.4-6.5-8.5V6.25L12 3.5z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M9.25 12.25l1.75 1.75 3.75-3.75" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Haklarım — sözleşme */
export function NavIconRights({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4.5h8.5l3.5 3.5V19.5H7V4.5z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M15.5 4.5V8h3.5" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M9.5 11.5h6M9.5 14.5h4.5M9.5 17.5h5.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="10.25" cy="8.75" r="1.1" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
}

/** Ayarlar */
export function NavIconSettings({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth={STROKE} />
      <path
        d="M12 4.25v2.1M12 17.65v2.1M4.25 12h2.1M17.65 12h2.1M6.4 6.4l1.5 1.5M16.1 16.1l1.5 1.5M6.4 17.6l1.5-1.5M16.1 7.9l1.5-1.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}
