/** Yönetici intro / PWA splash görseli ve renkleri */
export const ADMIN_INTRO_IMAGE = '/banner.png';

export const ADMIN_AUTH_BG_IMAGE = '/crewledger-desktop.png';

/** Intro / TWA splash arka planı */
export const ADMIN_PWA_SPLASH_BG = '#0f172a';
export const ADMIN_PWA_THEME = '#0f172a';

export const ADMIN_PWA_GRADIENT =
  'linear-gradient(180deg, #1e293b 0%, #0f172a 55%, #020617 100%)';

export const ADMIN_PWA_STARTUP_IMAGES = [
  {
    href: ADMIN_INTRO_IMAGE,
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: ADMIN_INTRO_IMAGE,
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: ADMIN_INTRO_IMAGE,
    media: '(orientation: portrait)',
  },
] as const;
