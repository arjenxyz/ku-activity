import { CREWLEDGER_ICON_BG } from '@/lib/brand';

/** Personel intro / PWA splash görseli ve renkleri */
export const PERSONNEL_INTRO_IMAGE = '/crewledger-intro.png';

/** Giriş, şifremi unuttum ve başvuru ekranları arka planı */
export const PERSONNEL_AUTH_BG_IMAGE = '/crewledger-temp.png';

/** PNG kenar tonu — PWA splash ve intro köprüsü (ikon ile aynı) */
export const PERSONNEL_PWA_SPLASH_BG = CREWLEDGER_ICON_BG;
export const PERSONNEL_PWA_THEME = '#163a5c';

export const PERSONNEL_PWA_GRADIENT =
  'linear-gradient(180deg, #1a3a52 0%, #001840 55%, #000f28 100%)';

/** iOS apple-touch-startup-image */
export const PERSONNEL_PWA_STARTUP_IMAGES = [
  {
    href: PERSONNEL_INTRO_IMAGE,
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: PERSONNEL_INTRO_IMAGE,
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: PERSONNEL_INTRO_IMAGE,
    media: '(orientation: portrait)',
  },
] as const;
