'use client';

type IconProps = { className?: string; filled?: boolean };

/** Özet */
export function NavIconHome({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 10.2 12 4.5l7 5.7V19a1.75 1.75 0 01-1.75 1.75H14.5v-5.75H9.5V20.75H6.75A1.75 1.75 0 015 19v-8.8z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 10.2 12 4.5l7 5.7V19a1.75 1.75 0 01-1.75 1.75H14.5v-5.75H9.5V20.75H6.75A1.75 1.75 0 015 19v-8.8z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path d="M9.5 20.75V13.5h5v7.25" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  );
}

/** Yevmiye */
export function NavIconWork({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 5.5h12a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 19V7A1.5 1.5 0 016 5.5z" fill="currentColor" fillOpacity="0.15" />
        <path d="M6 5.5h12a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 19V7A1.5 1.5 0 016 5.5z" stroke="currentColor" strokeWidth="1.85" />
        <path d="M4.5 9.5h15" stroke="currentColor" strokeWidth="1.85" />
        <path d="M8 4v2.5M16 4v2.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
        <rect x="7.5" y="12" width="3" height="3" rx="0.75" fill="currentColor" />
        <rect x="13.5" y="12" width="3" height="3" rx="0.75" fill="currentColor" fillOpacity="0.35" />
        <rect x="7.5" y="16.5" width="3" height="3" rx="0.75" fill="currentColor" fillOpacity="0.35" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="5.5" width="14" height="14.5" rx="2" stroke="currentColor" strokeWidth="1.85" />
      <path d="M5 10h14M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <rect x="8" y="12.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" fillOpacity="0.5" />
      <rect x="13.5" y="12.5" width="2.5" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Finans */
export function NavIconFinance({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 9h15a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-7A1.5 1.5 0 014.5 9z"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path
          d="M4.5 9h15a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-7A1.5 1.5 0 014.5 9z"
          stroke="currentColor"
          strokeWidth="1.85"
        />
        <path d="M3 12.5h18" stroke="currentColor" strokeWidth="1.85" />
        <circle cx="16" cy="15.5" r="1.75" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="8.5" width="17" height="10" rx="2" stroke="currentColor" strokeWidth="1.85" />
      <path d="M3.5 12h17" stroke="currentColor" strokeWidth="1.85" />
      <circle cx="16.5" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Menü */
export function NavIconMenu({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="4" width="7" height="7" rx="2" fill="currentColor" />
        <rect x="13" y="4" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.35" />
        <rect x="4" y="13" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.35" />
        <rect x="13" y="13" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.35" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.85" />
      <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.85" />
      <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.85" />
      <rect x="13" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.85" />
    </svg>
  );
}

/** Yoklama QR */
export function NavIconQr({ className = 'w-6 h-6', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6.5 4H5a1 1 0 00-1 1v1.5M17.5 4H19a1 1 0 011 1v1.5M4 17.5V19a1 1 0 001 1h1.5M19 17.5V19a1 1 0 01-1 1h-1.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor" />
        <rect x="13" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
        <rect x="7" y="13" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
        <path d="M14 14h2v2h-2zM14 17h2v2h-2zM17 14h2v2h-2z" fill="currentColor" fillOpacity="0.85" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 4H5a1 1 0 00-1 1v1.5M17.5 4H19a1 1 0 011 1v1.5M4 17.5V19a1 1 0 001 1h1.5M19 17.5V19a1 1 0 01-1 1h-1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="13" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <rect x="7" y="13" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <path d="M14 14h2v2M14 17h2v2M17 14h2v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

/** Mesai */
export function NavIconMesai({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.25" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.85" />
        <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.85" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Asgari */
export function NavIconAsgari({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3.25 18.25 6v5.5c0 4.15-2.8 6.95-6.25 8.55C8.55 18.45 5.75 15.65 5.75 11.5V6L12 3.25z"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinejoin="round"
        />
        <path d="M9.5 12.25 11.25 14l3.75-3.75" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.25 18.25 6v5.5c0 4.15-2.8 6.95-6.25 8.55C8.55 18.45 5.75 15.65 5.75 11.5V6L12 3.25z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path d="M9.5 12.25 11.25 14l3.75-3.75" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Haklarım */
export function NavIconRights({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 4.5h8l3.5 3.5V19.5H7V4.5z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" />
        <path d="M15.5 4.5V8h3.5M9.5 12h6M9.5 15h4.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4.5h8l3.5 3.5V19.5H7V4.5z" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" />
      <path d="M15.5 4.5V8h3.5M9.5 12h6M9.5 15h4.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  );
}

/** Ayarlar */
export function NavIconSettings({ className = 'w-5 h-5', filled = false }: IconProps) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.85" />
        <path
          d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.85" />
      <path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}
