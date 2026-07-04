'use client';

import strings from '@json/src/app/admin-panel/proje/[projectId]/raporlar/page.json';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, labelClass, inputClass } from '@/components/project/ui';
import { fetchProjectSummary, fetchRecords } from '@/lib/project-api';
import { formatMoney } from '@/lib/format';

export default function RaporlarPage() {
  const { projectId } = useParams() as { projectId: string };
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [monthStats, setMonthStats] = useState({ approved: 0, pending: 0, advances: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchProjectSummary(projectId),
      fetchRecords(projectId, 'work-logs', { month, approved: 'true' }),
      fetchRecords(projectId, 'work-logs', { month, approved: 'false' }),
      fetchRecords(projectId, 'deductions', { month, deductionType: 'advance' }),
    ])
      .then(([s, approved, pending, adv]) => {
        setSummary(s.summary ?? null);
        setMonthStats({
          approved: (approved.records ?? []).length,
          pending: (pending.records ?? []).length,
          advances: (adv.records ?? []).reduce(
            (sum: number, r: { amount: number }) => sum + Number(r.amount),
            0
          ),
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, month]);

  const cards = summary
    ? [
        { label: strings.totalWorkPay, value: formatMoney(Number(summary.total_work_pay ?? 0)) },
        { label: strings.workDays, value: String(summary.total_work_days ?? 0) },
        { label: strings.totalAdvances, value: formatMoney(Number(summary.total_advances ?? 0)) },
        { label: strings.activeEmployees, value: String(summary.active_employee_count ?? 0) },
      ]
    : [];

  return (
    <div>
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
      {error && <AlertBanner type="error" message={error} />}

      <div className="mb-6 max-w-xs">
        <label className={labelClass}>{strings.labelMonth}</label>
        <input
          type="month"
          className={inputClass}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>{strings.loading}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {cards.map((c) => (
              <div key={c.label} className={`${cardClass} p-4`}>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: strings.approvedYevmiye,
                value: monthStats.approved,
                href: `/admin-panel/proje/${projectId}/raporlar/onaylanan`,
              },
              {
                label: strings.pendingYevmiye,
                value: monthStats.pending,
                href: `/admin-panel/proje/${projectId}/raporlar/onaysiz`,
              },
              {
                label: strings.monthAdvanceTotal,
                value: formatMoney(monthStats.advances),
                href: `/admin-panel/proje/${projectId}/sorgulama/avans`,
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`${cardClass} p-4 hover:border-slate-300 transition-colors block`}
              >
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
                <p className="text-xs text-blue-600 mt-2">{strings.detailLink}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
