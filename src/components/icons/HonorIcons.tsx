'use client';

import type { CSSProperties, ReactNode } from 'react';

/** Honor / Magic UI tarzı dolu, yuvarlatılmış ikon seti */
export type HonorIconName =
  | 'home'
  | 'work'
  | 'calendar'
  | 'chart'
  | 'users'
  | 'user-plus'
  | 'clipboard'
  | 'lock'
  | 'wallet'
  | 'inbox'
  | 'scan'
  | 'minus'
  | 'shield'
  | 'grid'
  | 'team'
  | 'pie'
  | 'document'
  | 'sliders'
  | 'bar-chart'
  | 'check'
  | 'clock'
  | 'archive'
  | 'search'
  | 'report'
  | 'finance'
  | 'plus'
  | 'qr'
  | 'mesai'
  | 'rights'
  | 'settings'
  | 'phone'
  | 'card'
  | 'briefcase'
  | 'menu'
  | 'user';

export type HonorIconTheme =
  | 'blue'
  | 'indigo'
  | 'emerald'
  | 'teal'
  | 'violet'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'sky'
  | 'slate';

const THEME_GRADIENT: Record<HonorIconTheme, string> = {
  blue: 'from-[#5B9FFF] via-[#3B7FED] to-[#2563EB]',
  indigo: 'from-[#8B9CFF] via-[#6B7FED] to-[#4F46E5]',
  emerald: 'from-[#5FE0B0] via-[#34C98A] to-[#16A36A]',
  teal: 'from-[#5ED4F3] via-[#2BB8E0] to-[#0E9EC8]',
  violet: 'from-[#C4A5FF] via-[#9B6BFF] to-[#7C3AED]',
  amber: 'from-[#FFD06A] via-[#F5B942] to-[#E09B1A]',
  orange: 'from-[#FFB366] via-[#FF8F3D] to-[#F06B18]',
  rose: 'from-[#FF8FA8] via-[#F06285] to-[#E11D5C]',
  sky: 'from-[#7DD3FC] via-[#38BDF8] to-[#0EA5E9]',
  slate: 'from-[#A8B4C4] via-[#7B8A9E] to-[#5C6B7F]',
};

const SIZE_CLASS = {
  xs: 'h-7 w-7 rounded-[0.55rem]',
  sm: 'h-8 w-8 rounded-[0.62rem]',
  md: 'h-10 w-10 rounded-[0.72rem]',
  lg: 'h-11 w-11 rounded-[0.82rem]',
  xl: 'h-14 w-14 rounded-[1rem]',
} as const;

const GLYPH_CLASS = {
  xs: 'h-[0.95rem] w-[0.95rem]',
  sm: 'h-[1.05rem] w-[1.05rem]',
  md: 'h-[1.25rem] w-[1.25rem]',
  lg: 'h-[1.35rem] w-[1.35rem]',
  xl: 'h-[1.65rem] w-[1.65rem]',
} as const;

type TileProps = {
  name: HonorIconName;
  theme?: HonorIconTheme;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  muted?: boolean;
};

export function HonorIconTile({
  name,
  theme = 'blue',
  size = 'md',
  className = '',
  muted = false,
}: TileProps) {
  if (muted) {
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${THEME_GRADIENT[theme]} ${SIZE_CLASS[size]} shadow-sm shadow-black/10 ${className}`}
      >
        <HonorIconGlyph name={name} className={`${GLYPH_CLASS[size]} text-white`} />
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${THEME_GRADIENT[theme]} ${SIZE_CLASS[size]} shadow-md shadow-black/15 ring-1 ring-white/20 ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-x-[18%] top-[8%] h-[28%] rounded-full bg-white/30 blur-[0.5px]"
        aria-hidden
      />
      <HonorIconGlyph name={name} className={`relative ${GLYPH_CLASS[size]} text-white drop-shadow-sm`} />
    </span>
  );
}

type GlyphProps = {
  name: HonorIconName;
  className?: string;
  style?: CSSProperties;
};

export function HonorIconGlyph({ name, className = 'h-5 w-5', style }: GlyphProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {GLYPHS[name]}
    </svg>
  );
}

const GLYPHS: Record<HonorIconName, ReactNode> = {
  home: (
    <path d="M12 3.2 4.5 9.4v10.1a1.4 1.4 0 0 0 1.4 1.4H9.2v-5.8h5.6v5.8h3.3a1.4 1.4 0 0 0 1.4-1.4V9.4L12 3.2z" />
  ),
  work: (
    <>
      <path d="M7.2 6.8V5.6A2.2 2.2 0 0 1 9.4 3.4h5.2a2.2 2.2 0 0 1 2.2 2.2v1.2h1.4A2.2 2.2 0 0 1 20.4 8.9v9.7a2.2 2.2 0 0 1-2.2 2.2H5.8a2.2 2.2 0 0 1-2.2-2.2V8.9a2.2 2.2 0 0 1 2.2-2.1h1.4zM9.4 6.8h5.2V5.6H9.4v1.2z" />
      <rect x="8.2" y="11.8" width="2.8" height="2.8" rx="0.6" opacity="0.85" />
      <rect x="13" y="11.8" width="2.8" height="2.8" rx="0.6" opacity="0.55" />
    </>
  ),
  calendar: (
    <>
      <path d="M6.5 5.2h11a2 2 0 0 1 2 2v11.6a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7.2a2 2 0 0 1 2-2z" />
      <path d="M5.5 9.8h13v1.2H5.5V9.8z" fill="white" fillOpacity="0.35" />
      <rect x="8" y="4" width="1.8" height="3.2" rx="0.9" />
      <rect x="14.2" y="4" width="1.8" height="3.2" rx="0.9" />
      <rect x="8.2" y="12.8" width="2.6" height="2.6" rx="0.55" fill="white" fillOpacity="0.9" />
    </>
  ),
  chart: (
  <path d="M5.5 18.5V8.8a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v9.7H5.5zm5.1 0V5.8a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v12.7h-4.8zm5.1 0v-6a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v7.2h-4.8z" />
  ),
  users: (
    <>
      <circle cx="9" cy="9.2" r="2.8" />
      <path d="M4.8 18.2c.5-2.8 2.4-4.4 4.2-4.4s3.7 1.6 4.2 4.4H4.8z" />
      <circle cx="16.2" cy="10" r="2.2" opacity="0.75" />
      <path d="M13.2 18.2c.4-2 1.7-3.2 3-3.2 1.4 0 2.6 1.2 3 3.2h-6z" opacity="0.75" />
    </>
  ),
  'user-plus': (
    <>
      <circle cx="9.5" cy="9" r="2.7" />
      <path d="M4.8 18c.5-2.6 2.3-4.1 4.7-4.1s4.2 1.5 4.7 4.1H4.8z" />
      <path d="M17.8 8.2h2.2v2.2h-2.2v2.2h-2.2v-2.2h-2.2V8.2h2.2V6h2.2v2.2z" />
    </>
  ),
  clipboard: (
    <>
      <path d="M7.5 5.2h9a2.2 2.2 0 0 1 2.2 2.2v12.4a2.2 2.2 0 0 1-2.2 2.2h-9a2.2 2.2 0 0 1-2.2-2.2V7.4a2.2 2.2 0 0 1 2.2-2.2z" />
      <path d="M9.8 4.2h4.4a1.2 1.2 0 0 1 1.2 1.2v1.4H8.6V5.4a1.2 1.2 0 0 1 1.2-1.2z" fill="white" fillOpacity="0.35" />
      <rect x="9.2" y="11.5" width="5.6" height="1.5" rx="0.75" fill="white" fillOpacity="0.9" />
      <rect x="9.2" y="14.5" width="4" height="1.5" rx="0.75" fill="white" fillOpacity="0.65" />
    </>
  ),
  lock: (
    <path d="M7.8 10.2V8.6a4.2 4.2 0 1 1 8.4 0v1.6h1.3A2.2 2.2 0 0 1 19.7 12.4v6.8a2.2 2.2 0 0 1-2.2 2.2H6.5a2.2 2.2 0 0 1-2.2-2.2v-6.8a2.2 2.2 0 0 1 2.2-2.2h1.3zm2.2 0h4V8.6a2 2 0 1 0-4 0v1.6z" />
  ),
  wallet: (
    <>
      <path d="M4.8 7.8h14.4a1.8 1.8 0 0 1 1.8 1.8v8.6a1.8 1.8 0 0 1-1.8 1.8H4.8a1.8 1.8 0 0 1-1.8-1.8V9.6a1.8 1.8 0 0 1 1.8-1.8z" />
      <path d="M4.8 7.8V6.8a1.8 1.8 0 0 1 1.8-1.8h10.8a1.8 1.8 0 0 1 1.8 1.8v1" fill="white" fillOpacity="0.3" />
      <circle cx="16.8" cy="13.5" r="1.4" fill="white" fillOpacity="0.9" />
    </>
  ),
  inbox: (
    <>
      <path d="M4.5 7.2h15a1.8 1.8 0 0 1 1.8 1.8v8.2a1.8 1.8 0 0 1-1.8 1.8h-15a1.8 1.8 0 0 1-1.8-1.8V9a1.8 1.8 0 0 1 1.8-1.8z" />
      <path d="m4.5 9.8 4.8 3.6h6.7l4.8-3.6" fill="white" fillOpacity="0.25" />
      <circle cx="17.2" cy="8.2" r="1.6" fill="white" fillOpacity="0.95" />
    </>
  ),
  scan: (
    <>
      <path d="M6.5 5.5H5a1.2 1.2 0 0 0-1.2 1.2V8M18.5 5.5H20a1.2 1.2 0 0 1 1.2 1.2V8M5.8 18.5H5a1.2 1.2 0 0 1-1.2-1.2v-1.8M18.2 18.5H20a1.2 1.2 0 0 0 1.2-1.2v-1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="7.5" y="7.5" width="4" height="4" rx="0.8" />
      <rect x="12.5" y="7.5" width="4" height="4" rx="0.8" opacity="0.55" />
      <rect x="7.5" y="12.5" width="4" height="4" rx="0.8" opacity="0.55" />
      <rect x="13" y="13" width="2" height="2" rx="0.4" />
      <rect x="13" y="16" width="2" height="2" rx="0.4" />
      <rect x="16" y="13" width="2" height="2" rx="0.4" />
    </>
  ),
  minus: (
    <path d="M6.5 12.2h11v2.6h-11v-2.6z" />
  ),
  shield: (
    <path d="M12 3.1 18.8 6v5.4c0 4.1-2.8 6.9-6.8 8.5-4-.6-6.8-3.4-6.8-8.5V6L12 3.1zm-1.2 8.8 1.8 1.8 4-4.1-1.7-1.7-2.3 2.3-1-1-1.8 1.7z" />
  ),
  grid: (
    <>
      <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13" y="4.5" width="6.5" height="6.5" rx="1.6" opacity="0.7" />
      <rect x="4.5" y="13" width="6.5" height="6.5" rx="1.6" opacity="0.7" />
      <rect x="13" y="13" width="6.5" height="6.5" rx="1.6" opacity="0.5" />
    </>
  ),
  team: (
    <>
      <circle cx="8.5" cy="9.5" r="2.4" />
      <circle cx="15.5" cy="9.5" r="2.4" opacity="0.75" />
      <path d="M4.5 17.5c.6-2.2 2.2-3.5 4-3.5s3.4 1.3 4 3.5H4.5zm7 0c.6-2.2 2.2-3.5 4-3.5s3.4 1.3 4 3.5h-8z" opacity="0.85" />
    </>
  ),
  pie: (
    <>
      <path d="M12 4.5a7.5 7.5 0 1 0 7.5 7.5H12V4.5z" />
      <path d="M12 4.5V12h7.5A7.5 7.5 0 0 0 12 4.5z" fill="white" fillOpacity="0.35" />
    </>
  ),
  document: (
    <>
      <path d="M8 4.5h5.8L18 8.7v10.8a1.6 1.6 0 0 1-1.6 1.6H8a1.6 1.6 0 0 1-1.6-1.6V6.1A1.6 1.6 0 0 1 8 4.5z" />
      <path d="M13.8 4.5V8.7H18" fill="white" fillOpacity="0.3" />
      <rect x="9.2" y="11.8" width="5.6" height="1.4" rx="0.7" fill="white" fillOpacity="0.85" />
      <rect x="9.2" y="14.5" width="4.2" height="1.4" rx="0.7" fill="white" fillOpacity="0.6" />
    </>
  ),
  sliders: (
    <>
      <path d="M5 8.2h14v2H5v-2zM5 13.8h14v2H5v-2z" />
      <circle cx="9" cy="9.2" r="1.8" />
      <circle cx="15" cy="14.8" r="1.8" />
    </>
  ),
  'bar-chart': (
    <path d="M5.5 18.5h13v1.5H5.5v-1.5zM7.5 16.5V10a1.2 1.2 0 0 1 1.2-1.2h1.1a1.2 1.2 0 0 1 1.2 1.2v6.5H7.5zm4.5 0V7.5a1.2 1.2 0 0 1 1.2-1.2h1.1a1.2 1.2 0 0 1 1.2 1.2v9H12zm4.5 0v-4a1.2 1.2 0 0 1 1.2-1.2h1.1a1.2 1.2 0 0 1 1.2 1.2v5.2H16.5z" />
  ),
  check: (
    <path d="M9.2 16.2 5.4 12.4l1.8-1.8 2 2 7.6-7.6 1.8 1.8-9.4 9.4z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="7.8" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12 8.2v4.2l2.8 1.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  archive: (
    <>
      <path d="M5.5 6.5h13v3.2H5.5V6.5z" />
      <path d="M6.8 9.7h10.4v8.8a1.6 1.6 0 0 1-1.6 1.6H8.4a1.6 1.6 0 0 1-1.6-1.6V9.7z" />
      <path d="M9.8 12.2h4.4v1.8H9.8v-1.8z" fill="white" fillOpacity="0.85" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="5.8" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="m15.2 15.2 4.3 4.3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  report: (
    <>
      <path d="M7 4.5h7.2L18 8.3v11.2a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6V6.1A1.6 1.6 0 0 1 7 4.5z" />
      <rect x="9" y="11" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.85" />
      <rect x="9" y="14" width="4.5" height="1.5" rx="0.75" fill="white" fillOpacity="0.6" />
    </>
  ),
  finance: (
    <>
      <path d="M4.5 9.2h15a1.6 1.6 0 0 1 1.6 1.6v6.2a1.6 1.6 0 0 1-1.6 1.6h-15a1.6 1.6 0 0 1-1.6-1.6v-6.2a1.6 1.6 0 0 1 1.6-1.6z" />
      <path d="M3.5 12.5h17" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1.6" />
      <circle cx="16.5" cy="15.5" r="1.6" fill="white" fillOpacity="0.95" />
    </>
  ),
  plus: (
    <path d="M11 5.5h2v13h-2v-13zm-5.5 5.5h13v2h-13v-2z" />
  ),
  qr: (
    <>
      <path d="M6.5 5H5a1.2 1.2 0 0 0-1.2 1.2v1.8M18.5 5H20a1.2 1.2 0 0 1 1.2 1.2v1.8M4.8 17.5V19a1.2 1.2 0 0 0 1.2 1.2h1.8M18.2 17.5V19a1.2 1.2 0 0 0 1.2 1.2h1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="7.5" y="7.5" width="3.8" height="3.8" rx="0.7" />
      <rect x="12.7" y="7.5" width="3.8" height="3.8" rx="0.7" opacity="0.65" />
      <rect x="7.5" y="12.7" width="3.8" height="3.8" rx="0.7" opacity="0.65" />
      <rect x="13.2" y="13.2" width="1.8" height="1.8" rx="0.35" />
      <rect x="13.2" y="15.8" width="1.8" height="1.8" rx="0.35" />
      <rect x="15.8" y="13.2" width="1.8" height="1.8" rx="0.35" />
    </>
  ),
  mesai: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8.5v3.8l2.6 1.7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  rights: (
    <>
      <path d="M7.5 4.8h7.5l3.2 3.2v11.5a1.5 1.5 0 0 1-1.5 1.5H7.5a1.5 1.5 0 0 1-1.5-1.5V6.3a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M15 4.8V8h3.2" fill="white" fillOpacity="0.3" />
      <rect x="9" y="11.5" width="6.5" height="1.4" rx="0.7" fill="white" fillOpacity="0.85" />
      <rect x="9" y="14.2" width="4.5" height="1.4" rx="0.7" fill="white" fillOpacity="0.6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <path
        d="M12 4.2v1.8M12 18v1.8M4.2 12h1.8M18 12h1.8M6.4 6.4l1.3 1.3M16.3 16.3l1.3 1.3M6.4 17.6l1.3-1.3M16.3 7.7l1.3-1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
  phone: (
    <path d="M8.8 5.2h6.4a1.8 1.8 0 0 1 1.8 1.8v10a1.8 1.8 0 0 1-1.8 1.8H8.8a1.8 1.8 0 0 1-1.8-1.8v-10a1.8 1.8 0 0 1 1.8-1.8zm3.2 12.8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
  ),
  card: (
    <>
      <path d="M4.5 8.8h15a1.6 1.6 0 0 1 1.6 1.6v6.6a1.6 1.6 0 0 1-1.6 1.6h-15a1.6 1.6 0 0 1-1.6-1.6v-6.6a1.6 1.6 0 0 1 1.6-1.6z" />
      <path d="M3.5 12h17" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="6" y="14.5" width="5" height="1.4" rx="0.7" fill="white" fillOpacity="0.85" />
    </>
  ),
  briefcase: (
    <>
      <path d="M5.5 9.2h13v9.3a1.8 1.8 0 0 1-1.8 1.8H7.3a1.8 1.8 0 0 1-1.8-1.8V9.2z" />
      <path d="M9 9.2V7.4a1.8 1.8 0 0 1 1.8-1.8h2.4a1.8 1.8 0 0 1 1.8 1.8v1.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="11" y="12.5" width="2" height="2.5" rx="0.5" fill="white" fillOpacity="0.85" />
    </>
  ),
  menu: (
    <>
      <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.8" />
      <rect x="13" y="4.5" width="6.5" height="6.5" rx="1.8" opacity="0.65" />
      <rect x="4.5" y="13" width="6.5" height="6.5" rx="1.8" opacity="0.65" />
      <rect x="13" y="13" width="6.5" height="6.5" rx="1.8" opacity="0.45" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="9" r="3.2" />
      <path d="M6.2 18.8c.8-3 2.8-4.8 5.8-4.8s5 1.8 5.8 4.8H6.2z" />
    </>
  ),
};

export { THEME_GRADIENT as HONOR_ICON_THEMES };
