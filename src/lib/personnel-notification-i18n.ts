import { formatString } from '@/lib/strings/format';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import { LOCALE_BCP47, type Locale } from '@/lib/i18n/locale';
import type { PersonnelNotificationType } from '@/lib/personnel-notification-service';

type NotifStrings = ReturnType<typeof getRegistryStrings<'lib/personnel-notifications'>>;

const TYPE_TEMPLATE: Partial<
  Record<PersonnelNotificationType, keyof NotifStrings>
> = {
  attendance_reminder: 'attendanceReminder',
  attendance_session_cancelled: 'attendanceSessionCancelled',
  attendance_removed_from_list: 'attendanceRemovedFromList',
  attendance_did_not_work: 'attendanceDidNotWork',
  attendance_session_completed: 'attendanceSessionCompleted',
  advance_approved: 'advanceApproved',
  advance_cash_ready: 'advanceCashReady',
  advance_rejected: 'advanceRejected',
  advance_paid: 'advancePaid',
  minimum_wage_paid: 'minimumWagePaid',
  minimum_wage_updated: 'minimumWageUpdated',
  minimum_wage_removed: 'minimumWageRemoved',
  salary_paid: 'salaryPaid',
  deduction_added: 'deductionAdded',
  deduction_updated: 'deductionUpdated',
  deduction_removed: 'deductionRemoved',
  work_log_recorded: 'workLogRecorded',
  work_log_updated: 'workLogUpdated',
  work_log_deleted: 'workLogDeleted',
};

function formatAmount(locale: Locale, amount: unknown) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount ?? '');
  return new Intl.NumberFormat(LOCALE_BCP47[locale], { maximumFractionDigits: 0 }).format(n);
}

function str(data: Record<string, unknown>, key: string) {
  const v = data[key];
  if (v == null) return '';
  return String(v);
}

type Template = { title: string; body: string };

function pickTemplate(
  strings: NotifStrings,
  type: PersonnelNotificationType,
  data: Record<string, unknown>
): Template | null {
  if (type === 'advance_approved') {
    const hasCode = Boolean(str(data, 'transferToken').trim());
    return hasCode ? strings.advanceApproved : strings.advanceApprovedNoCode;
  }
  if (type === 'advance_rejected') {
    const reason = str(data, 'reason').trim();
    return reason ? strings.advanceRejected : strings.advanceRejectedNoReason;
  }
  const key = TYPE_TEMPLATE[type];
  if (!key) return null;
  const tpl = strings[key];
  if (!tpl || typeof tpl !== 'object' || !('title' in tpl)) return null;
  return tpl as Template;
}

/**
 * DB’de Türkçe saklanan title/body yerine type + data ile seçili dilde metin üretir.
 * Şablon çözülemezse kayıtlı title/body kullanılır.
 */
export function resolvePersonnelNotificationCopy(
  locale: Locale,
  item: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown> | null;
  }
): { title: string; body: string } {
  const strings = getRegistryStrings('lib/personnel-notifications', locale);
  const data = item.data ?? {};
  const type = item.type as PersonnelNotificationType;
  const template = pickTemplate(strings, type, data);
  if (!template) {
    return { title: item.title, body: item.body };
  }

  const defaultActor =
    (strings as { defaults?: { actorName?: string } }).defaults?.actorName ?? 'Admin';
  const actorName = str(data, 'actorName').trim() || defaultActor;
  const amount = formatAmount(locale, data.amount);
  const workDate = str(data, 'workDate') || str(data, 'date');
  const date = str(data, 'date') || workDate;
  const month = str(data, 'periodMonth') || str(data, 'month');
  const transferCode = str(data, 'transferToken').trim();
  const reason = str(data, 'reason').trim();
  const deductionType = str(data, 'type');
  const typeLabel =
    (strings.deductionTypeLabels as Record<string, string>)[deductionType] ??
    strings.deductionTypeLabels.deduction;

  const vars: Record<string, string> = {
    workDate,
    date,
    actorName,
    amount: data.amount != null ? amount : str(data, 'amount'),
    transferCode,
    reason,
    typeLabel,
    month,
  };

  // work_log amount is day count, not money — prefer raw string
  if (type === 'work_log_recorded' && data.amount != null) {
    vars.amount = String(data.amount);
  }

  return {
    title: formatString(template.title, vars),
    body: formatString(template.body, vars),
  };
}
