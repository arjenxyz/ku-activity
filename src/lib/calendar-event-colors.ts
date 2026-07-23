import type { WorkLogApprovalStatus } from '@/lib/work-log';

export type CalendarEventMarker = 'work' | 'mesai' | 'advance' | 'deduction' | 'minimum';

export const CALENDAR_MARKER_DOT: Record<CalendarEventMarker, string> = {
  work: 'bg-emerald-500',
  mesai: 'bg-sky-500',
  advance: 'bg-amber-500',
  deduction: 'bg-rose-500',
  minimum: 'bg-violet-500',
};

export const CALENDAR_APPROVAL_RING: Record<WorkLogApprovalStatus, string> = {
  confirmed: 'border-emerald-600 dark:border-emerald-400',
  pending_employee: 'border-amber-600 dark:border-amber-400',
  pending_admin: 'border-sky-600 dark:border-sky-400',
  disputed: 'border-red-600 dark:border-red-400',
  none: 'border-violet-600 dark:border-violet-400',
};

/** Yoklama durumu — hücre arka planı (rakam her zaman koyu / okunaklı) */
export const CALENDAR_PRESENCE_CELL = {
  worked:
    'border-slate-300 bg-emerald-50 dark:border-slate-500 dark:bg-emerald-950/45',
  absent:
    'border-rose-500 bg-rose-50 dark:border-rose-400 dark:bg-rose-950/45',
  leave:
    'border-amber-400 bg-amber-50 dark:border-amber-300 dark:bg-amber-950/40',
} as const;

export const CALENDAR_PRESENCE_DOT = {
  worked: 'bg-emerald-500',
  absent: 'bg-rose-500',
  leave: 'bg-amber-400',
} as const;
