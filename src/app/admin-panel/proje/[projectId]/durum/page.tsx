'use client';


import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useParams } from 'next/navigation';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass } from '@/components/project/ui';
import { fetchProjectSummary } from '@/lib/project-api';
import { formatMoney } from '@/lib/format';

export default function DurumPage() {

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/durum/page');
  const { projectId } = useParams() as { projectId: string };
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectSummary(projectId)
      .then((d) => {
        setSummary(d.summary ?? null);
        setNote(d.note ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const items = summary
    ? [
        { label: strings.totalWorkPay, value: formatMoney(Number(summary.total_work_pay ?? 0)) },
        { label: strings.totalWorkDays, value: String(summary.total_work_days ?? 0) },
        { label: strings.totalAdvances, value: formatMoney(Number(summary.total_advances ?? 0)) },
        { label: strings.totalDeductions, value: formatMoney(Number(summary.total_deductions ?? 0)) },
        { label: strings.totalMinimum, value: formatMoney(Number(summary.total_minimum ?? 0)) },
        { label: strings.employeeCount, value: String(summary.employee_count ?? 0) },
        { label: strings.activeEmployeeCount, value: String(summary.active_employee_count ?? 0) },
      ]
    : [];

  const netEstimate =
    summary != null
      ? Number(summary.total_work_pay ?? 0) -
        Number(summary.total_advances ?? 0) -
        Number(summary.total_deductions ?? 0) +
        Number(summary.total_minimum ?? 0)
      : 0;

  return (
    <div>
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
      {note && <AlertBanner type="error" message={note} />}
      {error && <AlertBanner type="error" message={error} />}

      {loading ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>{strings.loading}</div>
      ) : (
        <div className="space-y-4">
          <div className={`${cardClass} p-6 bg-slate-800 text-white`}>
            <p className="text-sm text-slate-300">{strings.estimatedNetTitle}</p>
            <p className="text-3xl font-bold mt-2">{formatMoney(netEstimate)}</p>
            <p className="text-xs text-slate-400 mt-2">{strings.estimatedNetHint}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.label} className={`${cardClass} p-4`}>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
