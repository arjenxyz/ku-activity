export const APP_NAME = 'CrewLedger';
export const APP_SHORT_NAME = 'CrewLedger';
export const APP_TAGLINE = 'Construction Workforce Platform';
export const APP_TAGLINE_TR = 'İnşaat Personel Yönetimi';
export const DEFAULT_APP_URL = 'https://crewledger.vercel.app';
export const DEFAULT_SUPPORT_EMAIL = 'hello@crewledger.app';
export const DEFAULT_DEVELOPER_NAME = 'Arjen';

/** Ana site / genel marka */
export const CREWLEDGER_APP_ICON = '/crewledger.png';

/** Personel uygulaması (PWA, TWA, Play Store) */
export const PERSONNEL_APP_ICON = '/personel-icon.png';

/** Yönetici uygulaması (PWA, TWA, Play Store) */
export const ADMIN_APP_ICON = '/yönetici.png';

export type AppIconVariant = 'personnel' | 'admin';

const APP_ICON_BY_VARIANT: Record<AppIconVariant, string> = {
  personnel: PERSONNEL_APP_ICON,
  admin: ADMIN_APP_ICON,
};

export function appIconForVariant(variant: AppIconVariant) {
  return APP_ICON_BY_VARIANT[variant];
}

export function notificationMonochromeIconPath(variant: AppIconVariant, size: 96 | 192 = 96) {
  return `/icons/${variant}/notification/${size}`;
}
