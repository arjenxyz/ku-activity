export const APP_NAME = 'EVENT MANAGEMENT SYSTEM';
export const APP_SHORT_NAME = 'EMS';
export const APP_TAGLINE = 'Öğrenci etkinlik hizmeti';
export const APP_TAGLINE_TR =
  'Etkinlik gününde katılımcıları ve maliyeti hesaplamak, bunları kamuoyuna açık paylaşmak için kurulmuş bir öğrenci hizmetidir. Üniversiteye bağlı değildir; üniversite içi etkinlikler için kullanılır.';
export const DEFAULT_APP_URL = '';
export const DEFAULT_SUPPORT_EMAIL = '';
export const DEFAULT_DEVELOPER_NAME = '';

/** Ana site / genel marka — mevcut CrewLedger görsel asset (geçici) */
export const APP_ICON = '/crewledger.png';

/** @deprecated use APP_ICON */
export const CREWLEDGER_APP_ICON = APP_ICON;

/** Student app icon (reuses existing design asset) */
export const STUDENT_APP_ICON = '/personel-icon.png';

/** @deprecated use STUDENT_APP_ICON */
export const PERSONNEL_APP_ICON = STUDENT_APP_ICON;

/** Admin / staff app icon */
export const ADMIN_APP_ICON = '/yönetici.png';

export type AppIconVariant = 'student' | 'staff' | 'admin' | 'personnel';

const APP_ICON_BY_VARIANT: Record<AppIconVariant, string> = {
  student: STUDENT_APP_ICON,
  staff: ADMIN_APP_ICON,
  admin: ADMIN_APP_ICON,
  personnel: STUDENT_APP_ICON,
};

export function appIconForVariant(variant: AppIconVariant) {
  return APP_ICON_BY_VARIANT[variant];
}

export function appIconFileName(variant: AppIconVariant) {
  return APP_ICON_BY_VARIANT[variant].replace(/^\//, '');
}

export function notificationMonochromeIconPath(
  variant: AppIconVariant,
  size: 96 | 192 = 96
) {
  const folder = variant === 'student' || variant === 'personnel' ? 'personnel' : 'admin';
  return `/icons/${folder}/notification/${size}`;
}
