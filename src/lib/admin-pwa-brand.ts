/** Yönetici intro / PWA splash görseli ve renkleri — personel paleti ile hizalı */
export const ADMIN_INTRO_IMAGE = '/banner.png';

export const ADMIN_AUTH_BG_IMAGE = '/crewledger-desktop.png';

/** Intro / TWA splash arka planı */
export const ADMIN_PWA_SPLASH_BG = '#0b1624';
export const ADMIN_PWA_THEME = '#163a5c';

export const ADMIN_PWA_GRADIENT =
  'linear-gradient(180deg, #1a3a52 0%, #0b1624 55%, #060d14 100%)';

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
