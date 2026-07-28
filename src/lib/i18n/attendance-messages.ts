/**
 * Yoklama mesaj kataloğu — çok dilli genişletmeye hazır.
 */

import messages from '@json/src/lib/i18n/attendance-messages.json';
import { LOCALE_COOKIE, LOCALES, resolveLocaleFromAcceptLanguage, type Locale } from '@/lib/i18n/locale';

export type AttendanceLocale = Locale;

export const ATTENDANCE_MESSAGE_CODES = {
  QR_ALREADY_USED: 'attendance.qr_already_used',
  INVALID_TOKEN: 'attendance.invalid_token',
  WRONG_PROJECT: 'attendance.wrong_project',
  SESSION_CANCELLED: 'attendance.session_cancelled',
  SESSION_COMPLETED: 'attendance.session_completed',
  SESSION_CLOSED: 'attendance.session_closed',
  SESSION_NOT_ACTIVE: 'attendance.session_not_active',
  WINDOW_CLOSED: 'attendance.window_closed',
  ALREADY_LISTED: 'attendance.already_listed',
  SCAN_SUCCESS: 'attendance.scan_success',
  SCAN_REPLACED: 'attendance.scan_replaced',
  WAITING: 'attendance.waiting',
  COMPLETED: 'attendance.completed',
  NONE: 'attendance.none',
  REMOVED_FROM_LIST: 'attendance.removed_from_list',
  DID_NOT_WORK: 'attendance.did_not_work',
  TOKEN_REQUIRED: 'attendance.token_required',
  SCAN_FAILED: 'attendance.scan_failed',
} as const;

export type AttendanceMessageCode =
  (typeof ATTENDANCE_MESSAGE_CODES)[keyof typeof ATTENDANCE_MESSAGE_CODES];

type MessageCatalog = Record<string, string>;

export function tAttendance(
  code: AttendanceMessageCode,
  locale: AttendanceLocale = 'tr'
): string {
  const catalog = messages as Record<string, MessageCatalog>;
  const localeMessages = catalog[locale];
  const enMessages = catalog.en;
  const trMessages = catalog.tr;
  return localeMessages?.[code] ?? enMessages?.[code] ?? trMessages?.[code] ?? code;
}

export function resolveAttendanceLocale(acceptLanguage?: string | null): AttendanceLocale {
  return resolveLocaleFromAcceptLanguage(acceptLanguage);
}

/**
 * İstekten dili çöz. Kullanıcının uygulamada seçtiği dil çerezi (crewledger_locale)
 * tarayıcının Accept-Language başlığından önceliklidir.
 */
export function resolveAttendanceLocaleFromRequest(request: Request): AttendanceLocale {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const pattern = `(?:^|;\\s*)${LOCALE_COOKIE}=(${LOCALES.join('|')})`;
    const match = cookieHeader.match(new RegExp(pattern));
    if (match) return match[1] as AttendanceLocale;
  }
  return resolveAttendanceLocale(request.headers.get('accept-language'));
}

export class AttendanceScanError extends Error {
  readonly code: AttendanceMessageCode;

  constructor(code: AttendanceMessageCode, locale: AttendanceLocale = 'tr') {
    super(tAttendance(code, locale));
    this.name = 'AttendanceScanError';
    this.code = code;
  }
}

export function isAttendanceScanError(err: unknown): err is AttendanceScanError {
  return err instanceof AttendanceScanError;
}
