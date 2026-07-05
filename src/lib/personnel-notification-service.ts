import type { SupabaseClient } from '@supabase/supabase-js';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/personnel-notifications.json';

export type PersonnelNotificationType =
  | 'attendance_reminder'
  | 'attendance_session_cancelled'
  | 'attendance_removed_from_list'
  | 'advance_approved'
  | 'advance_cash_ready'
  | 'advance_rejected'
  | 'advance_paid'
  | 'minimum_wage_paid'
  | 'salary_paid'
  | 'deduction_added'
  | 'general';

export type PersonnelNotificationRow = {
  id: string;
  employee_id: string;
  project_id: string;
  type: PersonnelNotificationType;
  title: string;
  body: string;
  href: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount);
}

function isMissingTableError(message: string) {
  return message.includes('personnel_notifications') || message.includes('personnel_push_subscriptions');
}

export async function notifyPersonnel(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    type: PersonnelNotificationType;
    title: string;
    body: string;
    href?: string;
    data?: Record<string, unknown>;
    dedupeKey?: string;
    sendPush?: boolean;
  }
): Promise<PersonnelNotificationRow | null> {
  const payload = {
    employee_id: params.employeeId,
    project_id: params.projectId,
    type: params.type,
    title: params.title,
    body: params.body,
    href: params.href ?? null,
    data: params.data ?? {},
    dedupe_key: params.dedupeKey ?? null,
  };

  const { data, error } = await admin
    .from('personnel_notifications')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505' && params.dedupeKey) return null;
    if (isMissingTableError(error.message)) return null;
    throw new Error(error.message);
  }

  const row = data as PersonnelNotificationRow;

  if (params.sendPush !== false && typeof window === 'undefined') {
    try {
      const { dispatchPersonnelPush } = await import('@/lib/personnel-push-service');
      await dispatchPersonnelPush(admin, {
        employeeId: params.employeeId,
        notificationId: row.id,
        title: row.title,
        body: row.body,
        href: row.href ?? '/personnel-panel',
      });
    } catch {
      /* push optional */
    }
  }

  return row;
}

export async function listPersonnelNotifications(
  admin: SupabaseClient,
  employeeId: string,
  limit = 40
) {
  const { data, error } = await admin
    .from('personnel_notifications')
    .select('id, type, title, body, href, data, read_at, created_at')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []) as Omit<PersonnelNotificationRow, 'employee_id' | 'project_id'>[];
}

export async function countUnreadPersonnelNotifications(admin: SupabaseClient, employeeId: string) {
  const { count, error } = await admin
    .from('personnel_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .is('read_at', null);

  if (error) {
    if (isMissingTableError(error.message)) return 0;
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markPersonnelNotificationRead(
  admin: SupabaseClient,
  employeeId: string,
  notificationId: string
) {
  const { error } = await admin
    .from('personnel_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('employee_id', employeeId)
    .is('read_at', null);

  if (error && !isMissingTableError(error.message)) throw new Error(error.message);
}

export async function markAllPersonnelNotificationsRead(admin: SupabaseClient, employeeId: string) {
  const { error } = await admin
    .from('personnel_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .is('read_at', null);

  if (error && !isMissingTableError(error.message)) throw new Error(error.message);
}

export async function notifyAttendanceReminder(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
) {
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'attendance_reminder',
    title: strings.attendanceReminder.title,
    body: strings.attendanceReminder.body,
    href: '/personnel-panel/yoklama',
    dedupeKey: `attendance_reminder:${params.workDate}`,
    data: { workDate: params.workDate },
  });
}

export async function notifyAttendanceNotice(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    workDate: string;
    noticeType: 'removed_from_list' | 'session_cancelled';
  }
) {
  const isCancelled = params.noticeType === 'session_cancelled';
  const template = isCancelled
    ? strings.attendanceSessionCancelled
    : strings.attendanceRemovedFromList;

  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: isCancelled ? 'attendance_session_cancelled' : 'attendance_removed_from_list',
    title: template.title,
    body: formatString(template.body, { workDate: params.workDate.slice(0, 10) }),
    href: '/personnel-panel/yoklama',
    data: { workDate: params.workDate.slice(0, 10), noticeType: params.noticeType },
  });
}

export async function notifyAdvanceApproved(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    requestId: string;
    amount: number;
    paymentMethod: 'bank_transfer' | 'cash';
  }
) {
  const amount = formatAmount(params.amount);
  if (params.paymentMethod === 'cash') {
    return notifyPersonnel(admin, {
      employeeId: params.employeeId,
      projectId: params.projectId,
      type: 'advance_cash_ready',
      title: strings.advanceCashReady.title,
      body: formatString(strings.advanceCashReady.body, { amount }),
      href: '/personnel-panel/avans-onay',
      data: { requestId: params.requestId, amount: params.amount },
    });
  }

  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'advance_approved',
    title: strings.advanceApproved.title,
    body: formatString(strings.advanceApproved.body, { amount }),
    href: '/personnel-panel/avans',
    data: { requestId: params.requestId, amount: params.amount },
  });
}

export async function notifyAdvanceRejected(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; requestId: string; reason?: string | null }
) {
  const body = params.reason?.trim()
    ? formatString(strings.advanceRejected.body, { reason: params.reason.trim() })
    : strings.advanceRejectedNoReason.body;

  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'advance_rejected',
    title: strings.advanceRejected.title,
    body,
    href: '/personnel-panel/avans',
    data: { requestId: params.requestId },
  });
}

export async function notifyAdvancePaid(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; requestId: string; amount: number }
) {
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'advance_paid',
    title: strings.advancePaid.title,
    body: formatString(strings.advancePaid.body, { amount: formatAmount(params.amount) }),
    href: '/personnel-panel?tab=finance',
    data: { requestId: params.requestId, amount: params.amount },
  });
}

export async function notifyMinimumWagePaid(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; amount: number; date: string }
) {
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'minimum_wage_paid',
    title: strings.minimumWagePaid.title,
    body: formatString(strings.minimumWagePaid.body, { amount: formatAmount(params.amount) }),
    href: '/personnel-panel?tab=asgari',
    data: { amount: params.amount, date: params.date },
  });
}

export async function notifySalaryPaid(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    periodMonth: string;
    amount: number;
  }
) {
  const monthLabel = params.periodMonth.slice(0, 7);
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'salary_paid',
    title: strings.salaryPaid.title,
    body: formatString(strings.salaryPaid.body, {
      month: monthLabel,
      amount: formatAmount(params.amount),
    }),
    href: '/personnel-panel?tab=finance',
    dedupeKey: `salary_paid:${monthLabel}`,
    data: { periodMonth: monthLabel, amount: params.amount },
  });
}

function deductionTypeLabel(type: string) {
  const labels = strings.deductionTypeLabels as Record<string, string>;
  return labels[type] ?? labels.deduction ?? 'Kesinti';
}

export async function notifyDeductionRecorded(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    deductionId: string;
    type: string;
    amount: number;
    date: string;
    description?: string | null;
  }
) {
  const typeLabel = deductionTypeLabel(params.type);
  const descriptionSuffix = params.description?.trim()
    ? ` Açıklama: ${params.description.trim()}`
    : '';

  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'deduction_added',
    title: formatString(strings.deductionAdded.title, { typeLabel }),
    body: formatString(strings.deductionAdded.body, {
      amount: formatAmount(params.amount),
      typeLabel: typeLabel.toLowerCase(),
      descriptionSuffix,
    }),
    href: '/personnel-panel?tab=finance',
    data: {
      deductionId: params.deductionId,
      type: params.type,
      amount: params.amount,
      date: params.date,
    },
  });
}
