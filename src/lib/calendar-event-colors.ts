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
  confirmed: 'border-emerald-400/90 dark:border-emerald-500',
  pending_employee: 'border-amber-400/90 dark:border-amber-500',
  pending_admin: 'border-sky-400/90 dark:border-sky-500',
  disputed: 'border-red-400/90 dark:border-red-500',
  none: 'border-violet-400/70 dark:border-violet-500',
};
