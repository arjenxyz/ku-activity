'use client';

import { FiCreditCard, FiDollarSign, FiPrinter, FiShield, FiXCircle } from 'react-icons/fi';
import { formatMoney } from '@/lib/format';
import type { Deduction, MinimumWage } from '@/lib/personnel-stats';
import { deductionTypeLabel } from '@/lib/personnel-stats';
import { PersonnelRecordRow, PersonnelSection } from './PersonnelRecordCard';
import { PersonnelStatGrid } from './PersonnelStatGrid';
import { formatDate } from '@/lib/format';

type Stats = {
  gross: number;
  totalAdvance: number;
  totalDeduct: number;
  totalMinimum: number;
  net: number;
  approvedDays: number;
  pendingDays: number;
};

type Props = {
  stats: Stats;
  employeeDailyWage?: number;
  advances: Deduction[];
  otherDeductions: Deduction[];
  minimumWages: MinimumWage[];
  onPrint?: () => void;
};

export function PersonnelFinancePanel({
  stats,
  employeeDailyWage,
  advances,
  otherDeductions,
  minimumWages,
  onPrint,
}: Props) {
  const rows = [
    { label: 'Brüt kazanç', value: stats.gross, tone: 'text-emerald-600' },
    { label: 'Avanslar (−)', value: -stats.totalAdvance, tone: 'text-amber-600' },
    { label: 'Kesintiler (−)', value: -stats.totalDeduct, tone: 'text-red-500' },
    ...(stats.totalMinimum > 0
      ? [{ label: 'Asgari ödemeler (+)', value: stats.totalMinimum, tone: 'text-indigo-600' }]
      : []),
  ];

  return (
    <div className="space-y-6 print-area">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/25">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Tahmini net maaş</p>
            <p className="text-3xl sm:text-4xl font-bold mt-2">{formatMoney(stats.net)}</p>
          </div>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="print:hidden shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm"
            >
              <FiPrinter className="w-4 h-4" />
              Yazdır
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <p className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
          Maaş dökümü
        </p>
        <ul>
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-50 dark:border-slate-700/80 last:border-0"
            >
              <span className="text-sm text-gray-600 dark:text-gray-300">{row.label}</span>
              <span className={`text-sm font-semibold tabular-nums ${row.tone}`}>
                {formatMoney(Math.abs(row.value))}
                {row.value < 0 ? '' : ''}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Net</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatMoney(stats.net)}
            </span>
          </li>
        </ul>
      </div>

      {employeeDailyWage != null && (
        <PersonnelStatGrid
          items={[
            {
              label: 'Günlük yevmiye',
              value: formatMoney(employeeDailyWage),
              icon: <FiDollarSign className="w-5 h-5 text-blue-600" />,
              accent: 'bg-blue-50 dark:bg-blue-900/30',
            },
            {
              label: 'Onaylı / Bekleyen',
              value: `${stats.approvedDays} / ${stats.pendingDays}`,
              icon: <FiShield className="w-5 h-5 text-emerald-600" />,
              accent: 'bg-emerald-50 dark:bg-emerald-900/30',
            },
          ]}
        />
      )}

      <PersonnelSection
        title="Avanslar"
        icon={<FiCreditCard className="w-5 h-5 text-amber-600" />}
        isEmpty={advances.length === 0}
      >
        <div>
          {advances.map((r) => (
            <PersonnelRecordRow
              key={r.id}
              left={formatDate(r.date)}
              right={formatMoney(Number(r.amount))}
              sub={r.description || undefined}
            />
          ))}
        </div>
      </PersonnelSection>

      <PersonnelSection
        title="Kesintiler"
        icon={<FiXCircle className="w-5 h-5 text-red-500" />}
        isEmpty={otherDeductions.length === 0}
      >
        <div>
          {otherDeductions.map((r) => (
            <PersonnelRecordRow
              key={r.id}
              left={formatDate(r.date)}
              right={formatMoney(Number(r.amount))}
              sub={r.description || deductionTypeLabel(r.type)}
            />
          ))}
        </div>
      </PersonnelSection>

      <PersonnelSection
        title="Asgari ücret"
        icon={<FiShield className="w-5 h-5 text-indigo-600" />}
        isEmpty={minimumWages.length === 0}
        emptyMessage="Bu dönem için asgari ücret kaydı yok"
      >
        <div>
          {minimumWages.map((r) => (
            <PersonnelRecordRow
              key={r.id}
              left={formatDate(r.date)}
              right={formatMoney(Number(r.amount))}
              sub={r.description || undefined}
            />
          ))}
        </div>
      </PersonnelSection>
    </div>
  );
}
