/**
 * Yoklama mesaj kataloğu — çok dilli genişletmeye hazır.
 * Yeni dil: AttendanceLocale union + messages altına ekleyin.
 */

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
  TOKEN_REQUIRED: 'attendance.token_required',
  SCAN_FAILED: 'attendance.scan_failed',
} as const;

export type AttendanceMessageCode =
  (typeof ATTENDANCE_MESSAGE_CODES)[keyof typeof ATTENDANCE_MESSAGE_CODES];

const messages: Record<AttendanceLocale, Record<AttendanceMessageCode, string>> = {
  tr: {
    [ATTENDANCE_MESSAGE_CODES.QR_ALREADY_USED]:
      'Bu kod veya QR zaten kullanıldı. Lütfen yöneticinizden güncel kodu isteyip tekrar okutun.',
    [ATTENDANCE_MESSAGE_CODES.INVALID_TOKEN]:
      'Geçersiz yoklama kodu. Lütfen yöneticinizden güncel QR veya kodu isteyin.',
    [ATTENDANCE_MESSAGE_CODES.WRONG_PROJECT]:
      'Bu kod sizin projenize ait değil.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_CANCELLED]:
      'Yoklama iptal edildi. Lütfen yöneticinizle iletişime geçip tekrar okutun.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_COMPLETED]:
      'Yoklama oturumu kapatıldı. Yeni kod için yöneticinizle iletişime geçin.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_CLOSED]:
      'Yoklama oturumu kapalı. Yöneticinizden yeni yoklama başlatmasını isteyin.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_NOT_ACTIVE]:
      'Yoklama oturumu aktif değil.',
    [ATTENDANCE_MESSAGE_CODES.WINDOW_CLOSED]:
      'Yoklama saati dışında. İzin verilen süre içinde tekrar deneyin.',
    [ATTENDANCE_MESSAGE_CODES.ALREADY_LISTED]:
      'Zaten yoklama listesindesiniz. Yöneticiniz işlemi tamamlayınca kaydedileceksiniz.',
    [ATTENDANCE_MESSAGE_CODES.SCAN_SUCCESS]:
      'Listeye eklendiniz. Yöneticiniz diğer personelin yoklamasını alıp işlemi tamamlayacak.',
    [ATTENDANCE_MESSAGE_CODES.SCAN_REPLACED]:
      'Yeniden okutma başarılı. Önceki kaydınız silindi, listeye tekrar eklendiniz.',
    [ATTENDANCE_MESSAGE_CODES.WAITING]:
      'Listeye eklendiniz. Yöneticiniz diğer personelin yoklamasını alıp işlemi tamamlayacak.',
    [ATTENDANCE_MESSAGE_CODES.COMPLETED]:
      'Bugünün yoklaması tamamlandı. Tam gün yevmiyeniz kaydedildi.',
    [ATTENDANCE_MESSAGE_CODES.NONE]:
      'Bu tarih için yoklama kaydınız yok.',
    [ATTENDANCE_MESSAGE_CODES.REMOVED_FROM_LIST]:
      'Yöneticiniz sizi yoklamadan çıkardı. Yanlış olduğunu düşünüyorsanız lütfen yöneticinizle iletişime geçin.',
    [ATTENDANCE_MESSAGE_CODES.TOKEN_REQUIRED]: 'QR kodu gerekli.',
    [ATTENDANCE_MESSAGE_CODES.SCAN_FAILED]: 'Yoklama kaydedilemedi.',
  },
  en: {
    [ATTENDANCE_MESSAGE_CODES.QR_ALREADY_USED]:
      'This code or QR has already been used. Ask your supervisor for the current code and scan again.',
    [ATTENDANCE_MESSAGE_CODES.INVALID_TOKEN]:
      'Invalid attendance code. Ask your supervisor for the current QR or code.',
    [ATTENDANCE_MESSAGE_CODES.WRONG_PROJECT]:
      'This code does not belong to your project.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_CANCELLED]:
      'Attendance was cancelled. Contact your supervisor and scan again.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_COMPLETED]:
      'The attendance session is closed. Contact your supervisor for a new code.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_CLOSED]:
      'The attendance session is closed. Ask your supervisor to start a new session.',
    [ATTENDANCE_MESSAGE_CODES.SESSION_NOT_ACTIVE]:
      'The attendance session is not active.',
    [ATTENDANCE_MESSAGE_CODES.WINDOW_CLOSED]:
      'Outside the attendance window. Try again during the allowed time.',
    [ATTENDANCE_MESSAGE_CODES.ALREADY_LISTED]:
      'You are already on the attendance list. Your entry will be saved when your supervisor completes the session.',
    [ATTENDANCE_MESSAGE_CODES.SCAN_SUCCESS]:
      'You have been added to the list. Your supervisor will finish attendance for the team.',
    [ATTENDANCE_MESSAGE_CODES.SCAN_REPLACED]:
      'Re-scan successful. Your previous entry was removed and you were added again.',
    [ATTENDANCE_MESSAGE_CODES.WAITING]:
      'You have been added to the list. Your supervisor will complete attendance for the team.',
    [ATTENDANCE_MESSAGE_CODES.COMPLETED]:
      "Today's attendance is complete. Your full-day wage has been recorded.",
    [ATTENDANCE_MESSAGE_CODES.NONE]:
      'No attendance record for this date.',
    [ATTENDANCE_MESSAGE_CODES.REMOVED_FROM_LIST]:
      'Your supervisor removed you from attendance. If you believe this is a mistake, contact them.',
    [ATTENDANCE_MESSAGE_CODES.TOKEN_REQUIRED]: 'QR code is required.',
    [ATTENDANCE_MESSAGE_CODES.SCAN_FAILED]: 'Attendance could not be recorded.',
  },
};

export function tAttendance(
  code: AttendanceMessageCode,
  locale: AttendanceLocale = 'tr'
): string {
  return messages[locale][code] ?? messages.tr[code] ?? code;
}

export function resolveAttendanceLocale(acceptLanguage?: string | null): AttendanceLocale {
  if (!acceptLanguage) return 'tr';
  const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
  if (primary.startsWith('en')) return 'en';
  return 'tr';
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
