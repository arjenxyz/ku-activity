/**
 * Yoklama mesaj kataloğu — çok dilli genişletmeye hazır.
 * Yeni dil: AttendanceLocale union + messages altına ekleyin.
 */

import messages from '@json/src/lib/i18n/attendance-messages.json';
import { LOCALE_COOKIE } from '@/lib/i18n/locale';

export type AttendanceLocale = 'tr' | 'en';

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

export function tAttendance(
  code: AttendanceMessageCode,
  locale: AttendanceLocale = 'tr'
): string {
  const localeMessages = messages[locale] as Record<string, string>;
  const fallbackMessages = messages.tr as Record<string, string>;
  return localeMessages[code] ?? fallbackMessages[code] ?? code;
}

export function resolveAttendanceLocale(acceptLanguage?: string | null): AttendanceLocale {
  if (!acceptLanguage) return 'tr';
  const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
  if (primary.startsWith('en')) return 'en';
  return 'tr';
}

/**
 * İstekten dili çöz. Kullanıcının uygulamada seçtiği dil çerezi (crewledger_locale)
 * tarayıcının Accept-Language başlığından önceliklidir; böylece EN seçili bir kullanıcı
 * TR tarayıcıda bile İngilizce mesaj alır.
 */
export function resolveAttendanceLocaleFromRequest(request: Request): AttendanceLocale {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(tr|en)`));
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
