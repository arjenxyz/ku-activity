'use client';

import { formatDate } from '@/lib/format';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatWorkLogSummary, getWorkLogApprovalStatus } from '@/lib/work-log';
import type { WorkLog } from '@/lib/personnel-stats';
import { PersonnelBadge, PersonnelRecordRow } from './PersonnelRecordCard';
import { workDayLabel } from '@/lib/personnel-stats';

type Props = {
  log: WorkLog;
};

export function PersonnelWorkLogItem({ log }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelWorkLogItem');
  const { locale } = useLocale();
  const status = getWorkLogApprovalStatus(log);
  const isQr = log.description?.toLowerCase().includes('qr');

  return (
    <div className="border-b border-gray-100 dark:border-slate-700 last:border-0">
      <PersonnelRecordRow
        left={formatDate(log.date)}
        right={
          <div className="flex flex-col items-end gap-1">
            <PersonnelBadge variant={log.amount === 1 ? 'success' : 'warning'}>
              {workDayLabel(Number(log.amount), log.mesai_type, locale)}
            </PersonnelBadge>
            {status === 'confirmed' && (
              <PersonnelBadge variant="success">
                {isQr ? strings.qrAttendance : strings.recorded}
              </PersonnelBadge>
            )}
          </div>
        }
        sub={
          log.description ||
          formatWorkLogSummary(Number(log.amount), log.mesai_type ?? null, locale)
        }
      />
    </div>
  );
}
