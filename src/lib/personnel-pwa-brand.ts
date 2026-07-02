/** Personel PWA/TWA splash ve tema renkleri (gökyüzü mavisi marka) */
export const PERSONNEL_PWA_SPLASH_BG = '#0ea5e9';
export const PERSONNEL_PWA_THEME = '#0284c7';
export const PERSONNEL_PWA_GRADIENT =
  'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 45%, #0284c7 100%)';

/** iOS apple-touch-startup-image — yaygın portrait boyutlar */
export const PERSONNEL_PWA_STARTUP_IMAGES = [
  {
    href: '/icons/personnel/splash/1170/2532?v=3',
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: '/icons/personnel/splash/1284/2778?v=3',
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: '/icons/personnel/splash/1170/2532?v=3',
    media: '(orientation: portrait)',
  },
] as const;
