'use client';


import { formatString } from '@/lib/strings/format';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { RecordsTable } from '@/components/project/RecordsTable';
import { AlertBanner } from '@/components/project/AlertBanner';
import { btnPrimary, labelClass, inputClass, cardClass } from '@/components/project/ui';
import { fetchPayroll, finalizePayroll, generatePayroll } from '@/lib/project-api';
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

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/bordro/page');
  const { projectId } = useParams() as { projectId: string };
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [periodStatus, setPeriodStatus] = useState<'draft' | 'finalized' | null>(null);
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
      setPeriodStatus((data.period?.status as 'draft' | 'finalized') ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadFailed);
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
      setSuccess(formatString(strings.successGenerated, { month }));
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.generateFailed);
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);
    setSuccess(null);
    try {
      await finalizePayroll(projectId, month);
      setPeriodStatus('finalized');
      setSuccess(formatString(strings.successFinalized, { month }));
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.finalizeFailed);
    } finally {
      setFinalizing(false);
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
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-end gap-4`}>
        <div className="flex-1 max-w-xs">
          <label className={labelClass}>{strings.labelPeriod}</label>
          <input
            type="month"
            className={inputClass}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <button type="button" className={btnPrimary} onClick={handleGenerate} disabled={generating}>
          {generating ? strings.generating : strings.generateButton}
        </button>
        {lines.length > 0 && periodStatus !== 'finalized' && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            onClick={handleFinalize}
            disabled={finalizing}
          >
            {finalizing ? strings.finalizing : strings.finalizeButton}
          </button>
        )}
      </div>

      {periodStatus === 'finalized' && (
        <p className="mb-4 text-sm font-medium text-emerald-700">{strings.statusFinalized}</p>
      )}

      {lines.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: strings.totalGross, value: formatMoney(totals.gross) },
            { label: strings.totalAdvances, value: formatMoney(totals.advances) },
            { label: strings.totalMinimum, value: formatMoney(totals.minimum) },
            { label: strings.totalNet, value: formatMoney(totals.net) },
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
        emptyMessage={strings.emptyMessage}
        columns={[
          { key: 'name', header: strings.colEmployee, render: (r) => r.employees?.name ?? strings.emptyCell },
          { key: 'days', header: strings.colDays, render: (r) => r.work_days },
          { key: 'gross', header: strings.colGross, render: (r) => formatMoney(Number(r.gross_pay)) },
          {
            key: 'adv',
            header: strings.colAdvance,
            render: (r) => formatMoney(Number(r.advances)),
            hideOnMobile: true,
          },
          {
            key: 'ded',
            header: strings.colDeduction,
            render: (r) => formatMoney(Number(r.other_deductions)),
            hideOnMobile: true,
          },
          {
            key: 'min',
            header: strings.colMinimum,
            render: (r) => formatMoney(Number(r.minimum_paid)),
            hideOnMobile: true,
          },
          { key: 'net', header: strings.colNet, render: (r) => formatMoney(Number(r.net_pay)) },
        ]}
      />
    </div>
  );
}
