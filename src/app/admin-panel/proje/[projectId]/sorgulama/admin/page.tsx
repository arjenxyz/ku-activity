'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { RecordsTable } from '@/components/project/RecordsTable';
import { labelClass, inputClass, cardClass } from '@/components/project/ui';
import { fetchProjectEmployees, fetchRecords } from '@/lib/project-api';
import { formatMoney } from '@/lib/format';

type SummaryRow = {
  id: string;
  name: string;
  workDays: number;
  gross: number;
  advances: number;
  minimum: number;
  net: number;
};

export default function AdminSorgulamaPage() {
  const { projectId } = useParams() as { projectId: string };
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProjectEmployees(projectId)
      .then(async (employees) => {
        const summaries: SummaryRow[] = [];
        for (const emp of employees.filter((e) => e.is_active)) {
          const [w, a, m] = await Promise.all([
            fetchRecords(projectId, 'work-logs', { employeeId: emp.id, month }),
            fetchRecords(projectId, 'deductions', {
              employeeId: emp.id,
              month,
              deductionType: 'advance',
            }),
            fetchRecords(projectId, 'minimum-wages', { employeeId: emp.id, month }),
          ]);
          const workDays = (w.records ?? []).reduce(
            (s: number, r: { amount: number }) => s + Number(r.amount),
            0
          );
          const gross = workDays * Number(emp.daily_wage);
          const advances = (a.records ?? []).reduce(
            (s: number, r: { amount: number }) => s + Number(r.amount),
            0
          );
          const minimum = (m.records ?? []).reduce(
            (s: number, r: { amount: number }) => s + Number(r.amount),
            0
          );
          summaries.push({
            id: emp.id,
            name: emp.name,
            workDays,
            gross,
            advances,
            minimum,
            net: gross - advances,
          });
        }
        setRows(summaries);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, month]);

  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.gross,
      advances: acc.advances + r.advances,
      net: acc.net + r.net,
    }),
    { gross: 0, advances: 0, net: 0 }
  );

  return (
    <div>
      <ProjectPageHeader
        title="Admin Sorgulama"
        description="Tüm personelin aylık finansal özeti."
      />
      {error && <AlertBanner type="error" message={error} />}

      <div className="mb-6 max-w-xs">
        <label className={labelClass}>Ay</label>
        <input
          type="month"
          className={inputClass}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Toplam Brüt', value: formatMoney(totals.gross) },
          { label: 'Toplam Avans', value: formatMoney(totals.advances) },
          { label: 'Toplam Net', value: formatMoney(totals.net) },
        ].map((s) => (
          <div key={s.label} className={`${cardClass} p-4`}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <RecordsTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'name', header: 'Personel', render: (r) => r.name },
          { key: 'days', header: 'Gün', render: (r) => r.workDays },
          { key: 'gross', header: 'Brüt', render: (r) => formatMoney(r.gross) },
          {
            key: 'adv',
            header: 'Avans',
            render: (r) => formatMoney(r.advances),
            hideOnMobile: true,
          },
          {
            key: 'min',
            header: 'Asgari',
            render: (r) => formatMoney(r.minimum),
            hideOnMobile: true,
          },
          { key: 'net', header: 'Net', render: (r) => formatMoney(r.net) },
        ]}
      />
    </div>
  );
}
