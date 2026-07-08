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
  confirmed: 'ring-2 ring-emerald-400/80 dark:ring-emerald-600',
  pending_employee: 'ring-2 ring-amber-400/80 dark:ring-amber-600',
  pending_admin: 'ring-2 ring-sky-400/80 dark:ring-sky-600',
  disputed: 'ring-2 ring-red-400/80 dark:ring-red-600',
  none: 'ring-2 ring-violet-400/60 dark:ring-violet-600',
};
