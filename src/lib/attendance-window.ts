import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/attendance-window.json';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_PROJECT_TIMEZONE = 'Europe/Istanbul';
export const DEFAULT_WORK_START = '08:00';
export const DEFAULT_WORK_END = '17:00';

export type ProjectAttendanceSchedule = {
  timezone: string;
  workStartTime: string;
  workEndTime: string;
};

export type AttendanceWindowStatus = {
  workDate: string;
  timezone: string;
  workStartTime: string;
  workEndTime: string;
  windowStart: string;
  windowEnd: string;
  windowStartLabel: string;
  windowEndLabel: string;
  isOpen: boolean;
  currentOpenWorkDate: string | null;
  message: string;
};

export function normalizeTimeHHmm(raw: string | null | undefined, fallback = DEFAULT_WORK_START): string {
  if (!raw) return fallback;
  const part = String(raw).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(part) ? part : fallback;
}

export function scheduleFromProjectRow(row: {
  timezone?: string | null;
  work_start_time?: string | null;
  work_end_time?: string | null;
}): ProjectAttendanceSchedule {
  return {
    timezone: row.timezone?.trim() || DEFAULT_PROJECT_TIMEZONE,
    workStartTime: normalizeTimeHHmm(row.work_start_time, DEFAULT_WORK_START),
    workEndTime: normalizeTimeHHmm(row.work_end_time, DEFAULT_WORK_END),
  };
}

export async function loadProjectAttendanceSchedule(
  admin: SupabaseClient,
  projectId: string
): Promise<ProjectAttendanceSchedule> {
  const { data, error } = await admin
    .from('projects')
    .select('timezone, work_start_time, work_end_time')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(strings.errors.projectNotFound);

  return scheduleFromProjectRow(data);
}

export function getAttendanceWindowBounds(
  workDate: string,
  schedule: ProjectAttendanceSchedule
): { windowStart: dayjs.Dayjs; windowEnd: dayjs.Dayjs } {
  const tz = schedule.timezone;
  const date = workDate.slice(0, 10);
  const endTime = normalizeTimeHHmm(schedule.workEndTime, DEFAULT_WORK_END);
  const startTime = normalizeTimeHHmm(schedule.workStartTime, DEFAULT_WORK_START);

  const windowStart = dayjs.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm', tz);
  const nextDay = dayjs.tz(date, 'YYYY-MM-DD', tz).add(1, 'day').format('YYYY-MM-DD');
  const windowEnd = dayjs.tz(`${nextDay} ${startTime}`, 'YYYY-MM-DD HH:mm', tz).subtract(1, 'minute');

  return { windowStart, windowEnd };
}

export function isAttendanceWindowOpen(
  workDate: string,
  schedule: ProjectAttendanceSchedule,
  now: Date | string = new Date()
): boolean {
  const tz = schedule.timezone;
  const t = dayjs(now).tz(tz);
  const { windowStart, windowEnd } = getAttendanceWindowBounds(workDate, schedule);
  return (
    (t.isAfter(windowStart) || t.isSame(windowStart)) &&
    (t.isBefore(windowEnd) || t.isSame(windowEnd))
  );
}

/** Şu an yoklama penceresi açık olan iş günü (en fazla bir tane) */
export function getCurrentOpenWorkDate(
  schedule: ProjectAttendanceSchedule,
  now: Date | string = new Date()
): string | null {
  const tz = schedule.timezone;
  const base = dayjs(now).tz(tz);
  const candidates = [
    base.format('YYYY-MM-DD'),
    base.subtract(1, 'day').format('YYYY-MM-DD'),
  ];

  for (const workDate of candidates) {
    if (isAttendanceWindowOpen(workDate, schedule, now)) {
      return workDate;
    }
  }
  return null;
}

function formatWindowLabel(instant: dayjs.Dayjs): string {
  return instant.format('DD.MM.YYYY HH:mm');
}

export function getAttendanceWindowStatus(
  workDate: string,
  schedule: ProjectAttendanceSchedule,
  now: Date | string = new Date()
): AttendanceWindowStatus {
  const date = workDate.slice(0, 10);
  const { windowStart, windowEnd } = getAttendanceWindowBounds(date, schedule);
  const isOpen = isAttendanceWindowOpen(date, schedule, now);
  const currentOpenWorkDate = getCurrentOpenWorkDate(schedule, now);
  const startLabel = formatWindowLabel(windowStart);
  const endLabel = formatWindowLabel(windowEnd);

  let message: string;
  if (isOpen) {
    message = formatString(strings.messages.open, {
      date,
      startLabel,
      endLabel,
      timezone: schedule.timezone,
    });
  } else if (currentOpenWorkDate) {
    message = formatString(strings.messages.otherDateOpen, { currentOpenWorkDate });
  } else {
    message = formatString(strings.messages.closed, {
      date,
      startLabel,
      endLabel,
      timezone: schedule.timezone,
    });
  }

  return {
    workDate: date,
    timezone: schedule.timezone,
    workStartTime: schedule.workStartTime,
    workEndTime: schedule.workEndTime,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    windowStartLabel: startLabel,
    windowEndLabel: endLabel,
    isOpen,
    currentOpenWorkDate,
    message,
  };
}

export function assertAttendanceWindowOpen(
  workDate: string,
  schedule: ProjectAttendanceSchedule,
  now?: Date
): void {
  if (isAttendanceWindowOpen(workDate, schedule, now)) return;

  const status = getAttendanceWindowStatus(workDate, schedule, now);
  throw new Error(
    formatString(strings.errors.outsideWindow, {
      workDate: status.workDate,
      windowStartLabel: status.windowStartLabel,
      windowEndLabel: status.windowEndLabel,
      timezone: status.timezone,
    })
  );
}

/** Konum metninden tahmini saat dilimi */
export function guessTimezoneFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const text = location.toLowerCase();

  const rules: Array<[RegExp, string]> = [
    [/türkiye|turkey|istanbul|ankara|izmir|antalya|bursa/i, 'Europe/Istanbul'],
    [/almanya|germany|berlin|münih|munich|hamburg|frankfurt/i, 'Europe/Berlin'],
    [/ingiltere|uk|london|londra|england/i, 'Europe/London'],
    [/fransa|france|paris/i, 'Europe/Paris'],
    [/hollanda|netherlands|amsterdam/i, 'Europe/Amsterdam'],
    [/bae|dubai|abu dhabi|birleşik arap/i, 'Asia/Dubai'],
    [/suudi|riyadh|jeddah|saudi/i, 'Asia/Riyadh'],
    [/katar|qatar|doha/i, 'Asia/Qatar'],
    [/azerbaycan|baku|bakü/i, 'Asia/Baku'],
    [/rusya|russia|moscow|moskova/i, 'Europe/Moscow'],
    [/amerika|usa|new york|chicago|los angeles/i, 'America/New_York'],
  ];

  for (const [pattern, tz] of rules) {
    if (pattern.test(text)) return tz;
  }
  return null;
}

export function getProjectCalendarDate(
  schedule: ProjectAttendanceSchedule,
  now: Date | string = new Date()
): string {
  return dayjs(now).tz(schedule.timezone).format('YYYY-MM-DD');
}

export const COMMON_PROJECT_TIMEZONES = strings.timezones as ReadonlyArray<{
  value: string;
  label: string;
}>;
