'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { RecordsTable } from '@/components/project/RecordsTable';
import { AlertBanner } from '@/components/project/AlertBanner';
import { btnPrimary, labelClass, inputClass, cardClass } from '@/components/project/ui';
import { fetchPayroll, generatePayroll } from '@/lib/project-api';
import { formatMoney } from '@/lib/format';

type PayrollLine = {
  id: string;
  work_days: number;
  gross_pay: number;
  advances: number;
  other_deductions: number;
  minimum_paid: number;
  net_pay: number;
  employees?: { name: string } | null;
};

export default function BordroPage() {
  const { projectId } = useParams() as { projectId: string };
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPayroll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPayroll(projectId, month);
      const raw = data.period?.payroll_lines ?? data.lines ?? [];
      setLines(
        raw.map((l: PayrollLine & { employee_id?: string }, i: number) => ({
          ...l,
          id: l.id ?? l.employee_id ?? `line-${i}`,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bordro yüklenemedi');
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, month]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await generatePayroll(projectId, month);
      setLines(
        (data.lines ?? []).map((l: PayrollLine & { employee_id?: string }, i: number) => ({
          ...l,
          id: l.id ?? l.employee_id ?? `line-${i}`,
        }))
      );
      setSuccess(`${month} bordrosu hesaplandı.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hesaplama başarısız');
    } finally {
      setGenerating(false);
    }
  };

  const totals = lines.reduce(
    (acc, l) => ({
      gross: acc.gross + Number(l.gross_pay),
      net: acc.net + Number(l.net_pay),
      advances: acc.advances + Number(l.advances),
      minimum: acc.minimum + Number(l.minimum_paid),
    }),
    { gross: 0, net: 0, advances: 0, minimum: 0 }
  );

  return (
    <div>
      <ProjectPageHeader
        title="Maaş Bordroları"
        description="Aylık bordro hesaplayın ve görüntüleyin."
      />
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-end gap-4`}>
        <div className="flex-1 max-w-xs">
          <label className={labelClass}>Dönem</label>
          <input
            type="month"
            className={inputClass}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <button type="button" className={btnPrimary} onClick={handleGenerate} disabled={generating}>
          {generating ? 'Hesaplanıyor…' : 'Bordro Hesapla'}
        </button>
      </div>

      {lines.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Toplam Brüt', value: formatMoney(totals.gross) },
            { label: 'Toplam Avans', value: formatMoney(totals.advances) },
            { label: 'Toplam Asgari', value: formatMoney(totals.minimum) },
            { label: 'Toplam Net', value: formatMoney(totals.net) },
          ].map((s) => (
            <div key={s.label} className={`${cardClass} p-4`}>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <RecordsTable
        loading={loading}
        rows={lines}
        emptyMessage="Bu dönem için bordro yok. Hesapla butonuna tıklayın."
        columns={[
          { key: 'name', header: 'Personel', render: (r) => r.employees?.name ?? '—' },
          { key: 'days', header: 'Gün', render: (r) => r.work_days },
          { key: 'gross', header: 'Brüt', render: (r) => formatMoney(Number(r.gross_pay)) },
          {
            key: 'adv',
            header: 'Avans',
            render: (r) => formatMoney(Number(r.advances)),
            hideOnMobile: true,
          },
          {
            key: 'ded',
            header: 'Kesinti',
            render: (r) => formatMoney(Number(r.other_deductions)),
            hideOnMobile: true,
          },
          {
            key: 'min',
            header: 'Asgari',
            render: (r) => formatMoney(Number(r.minimum_paid)),
            hideOnMobile: true,
          },
          { key: 'net', header: 'Net', render: (r) => formatMoney(Number(r.net_pay)) },
        ]}
      />
    </div>
  );
}
