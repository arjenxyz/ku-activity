import type { SupabaseClient } from '@supabase/supabase-js';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/personnel-notifications.json';

export type PersonnelNotificationType =
  | 'attendance_reminder'
  | 'attendance_session_cancelled'
  | 'attendance_removed_from_list'
  | 'attendance_did_not_work'
  | 'attendance_session_completed'
  | 'advance_approved'
  | 'advance_cash_ready'
  | 'advance_rejected'
  | 'advance_paid'
  | 'minimum_wage_paid'
  | 'minimum_wage_updated'
  | 'minimum_wage_removed'
  | 'salary_paid'
  | 'deduction_added'
  | 'deduction_updated'
  | 'deduction_removed'
  | 'work_log_recorded'
  | 'work_log_updated'
  | 'work_log_deleted'
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

export async function deletePersonnelNotification(
  admin: SupabaseClient,
  employeeId: string,
  notificationId: string
) {
  const { error } = await admin
    .from('personnel_notifications')
    .delete()
    .eq('id', notificationId)
    .eq('employee_id', employeeId);

  if (error && !isMissingTableError(error.message)) throw new Error(error.message);
}

export async function deleteAllPersonnelNotifications(admin: SupabaseClient, employeeId: string) {
  const { error } = await admin
    .from('personnel_notifications')
    .delete()
    .eq('employee_id', employeeId);

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
    noticeType: 'removed_from_list' | 'session_cancelled' | 'did_not_work';
    actorName?: string;
  }
) {
  const workDate = params.workDate.slice(0, 10);
  const actorName = params.actorName?.trim() || 'Yönetici';
  if (params.noticeType === 'did_not_work') {
    return notifyPersonnel(admin, {
      employeeId: params.employeeId,
      projectId: params.projectId,
      type: 'attendance_did_not_work',
      title: strings.attendanceDidNotWork.title,
      body: formatString(strings.attendanceDidNotWork.body, { workDate, actorName }),
      href: '/personnel-panel?tab=work',
      data: { workDate, noticeType: params.noticeType, actorName },
    });
  }

  const isCancelled = params.noticeType === 'session_cancelled';
  const template = isCancelled
    ? strings.attendanceSessionCancelled
    : strings.attendanceRemovedFromList;

  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: isCancelled ? 'attendance_session_cancelled' : 'attendance_removed_from_list',
    title: template.title,
    body: formatString(template.body, { workDate, actorName }),
    href: '/personnel-panel/yoklama',
    data: { workDate, noticeType: params.noticeType, actorName },
  });
}

export async function notifyAttendanceSessionCompleted(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string; sessionId: string }
) {
  const workDate = params.workDate.slice(0, 10);
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'attendance_session_completed',
    title: strings.attendanceSessionCompleted.title,
    body: formatString(strings.attendanceSessionCompleted.body, { workDate }),
    href: '/personnel-panel?tab=work',
    dedupeKey: `attendance_completed:${params.sessionId}`,
    data: { workDate, sessionId: params.sessionId },
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
    transferToken?: string | null;
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

  const body =
    params.transferToken?.trim()
      ? formatString(strings.advanceApproved.body, {
          amount,
          transferCode: params.transferToken.trim(),
        })
      : formatString(strings.advanceApprovedNoCode.body, { amount });

  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'advance_approved',
    title: strings.advanceApproved.title,
    body,
    href: '/personnel-panel/avans',
    data: { requestId: params.requestId, amount: params.amount, transferToken: params.transferToken },
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
  params: { employeeId: string; projectId: string; amount: number; date: string; actorName?: string }
) {
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'minimum_wage_paid',
    title: strings.minimumWagePaid.title,
    body: formatString(strings.minimumWagePaid.body, {
      amount: formatAmount(params.amount),
      actorName,
    }),
    href: '/personnel-panel?tab=asgari',
    data: { amount: params.amount, date: params.date, actorName },
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
    actorName?: string;
  }
) {
  const typeLabel = deductionTypeLabel(params.type);
  const actorName = params.actorName?.trim() || 'Yönetici';

  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'deduction_added',
    title: formatString(strings.deductionAdded.title, { typeLabel }),
    body: formatString(strings.deductionAdded.body, {
      amount: formatAmount(params.amount),
      typeLabel,
      actorName,
    }),
    href: '/personnel-panel?tab=finance',
    data: {
      deductionId: params.deductionId,
      type: params.type,
      amount: params.amount,
      date: params.date,
      actorName,
    },
  });
}

export async function notifyWorkLogRecorded(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    workLogId: string;
    date: string;
    amount: number;
    actorName?: string;
  }
) {
  const workDate = params.date.slice(0, 10);
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'work_log_recorded',
    title: strings.workLogRecorded.title,
    body: formatString(strings.workLogRecorded.body, {
      workDate,
      amount: String(params.amount),
      actorName,
    }),
    href: '/personnel-panel?tab=work',
    data: { workLogId: params.workLogId, workDate, amount: params.amount, actorName },
  });
}

export async function notifyWorkLogUpdated(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    workLogId: string;
    date: string;
    actorName?: string;
  }
) {
  const workDate = params.date.slice(0, 10);
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'work_log_updated',
    title: strings.workLogUpdated.title,
    body: formatString(strings.workLogUpdated.body, { workDate, actorName }),
    href: '/personnel-panel?tab=work',
    data: { workLogId: params.workLogId, workDate, actorName },
  });
}

export async function notifyWorkLogDeleted(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    workLogId: string;
    date: string;
    actorName?: string;
  }
) {
  const workDate = params.date.slice(0, 10);
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'work_log_deleted',
    title: strings.workLogDeleted.title,
    body: formatString(strings.workLogDeleted.body, { workDate, actorName }),
    href: '/personnel-panel?tab=work',
    data: { workLogId: params.workLogId, workDate, actorName },
  });
}

export async function notifyDeductionUpdated(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    deductionId: string;
    type: string;
    amount: number;
    date: string;
    actorName?: string;
  }
) {
  const typeLabel = deductionTypeLabel(params.type);
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'deduction_updated',
    title: formatString(strings.deductionUpdated.title, { typeLabel }),
    body: formatString(strings.deductionUpdated.body, {
      amount: formatAmount(params.amount),
      typeLabel,
      date: params.date.slice(0, 10),
      actorName,
    }),
    href: '/personnel-panel?tab=finance',
    data: {
      deductionId: params.deductionId,
      type: params.type,
      amount: params.amount,
      date: params.date,
      actorName,
    },
  });
}

export async function notifyDeductionRemoved(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    deductionId: string;
    type: string;
    amount: number;
    date: string;
    actorName?: string;
  }
) {
  const typeLabel = deductionTypeLabel(params.type);
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'deduction_removed',
    title: formatString(strings.deductionRemoved.title, { typeLabel }),
    body: formatString(strings.deductionRemoved.body, {
      amount: formatAmount(params.amount),
      typeLabel,
      date: params.date.slice(0, 10),
      actorName,
    }),
    href: '/personnel-panel?tab=finance',
    data: {
      deductionId: params.deductionId,
      type: params.type,
      amount: params.amount,
      date: params.date,
      actorName,
    },
  });
}

export async function notifyMinimumWageUpdated(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    amount: number;
    date: string;
    recordId: string;
    actorName?: string;
  }
) {
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'minimum_wage_updated',
    title: strings.minimumWageUpdated.title,
    body: formatString(strings.minimumWageUpdated.body, {
      amount: formatAmount(params.amount),
      date: params.date.slice(0, 10),
      actorName,
    }),
    href: '/personnel-panel?tab=asgari',
    data: { recordId: params.recordId, amount: params.amount, date: params.date, actorName },
  });
}

export async function notifyMinimumWageRemoved(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    amount: number;
    date: string;
    recordId: string;
    actorName?: string;
  }
) {
  const actorName = params.actorName?.trim() || 'Yönetici';
  return notifyPersonnel(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    type: 'minimum_wage_removed',
    title: strings.minimumWageRemoved.title,
    body: formatString(strings.minimumWageRemoved.body, {
      amount: formatAmount(params.amount),
      date: params.date.slice(0, 10),
      actorName,
    }),
    href: '/personnel-panel?tab=asgari',
    data: { recordId: params.recordId, amount: params.amount, date: params.date, actorName },
  });
}
