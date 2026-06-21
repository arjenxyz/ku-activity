'use client';

import { FiPrinter } from 'react-icons/fi';
import { formatMoney } from '@/lib/format';

type Stats = {
  gross: number;
  basePay: number;
  mesaiPay: number;
  totalAdvance: number;
  totalDeduct: number;
  totalMinimum: number;
  net: number;
};

type Props = {
  stats: Stats;
  onPrint?: () => void;
};

export function PersonnelFinancePanel({ stats, onPrint }: Props) {
  const rows = [
    { label: 'Yevmiye (gün × ücret)', value: stats.basePay, tone: 'text-emerald-600' },
    ...(stats.mesaiPay > 0
      ? [{ label: 'Mesai kazancı (+)', value: stats.mesaiPay, tone: 'text-orange-600' }]
      : []),
    { label: 'Brüt toplam', value: stats.gross, tone: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'Avanslar (−)', value: -stats.totalAdvance, tone: 'text-amber-600' },
    { label: 'Kesintiler (−)', value: -stats.totalDeduct, tone: 'text-red-500' },
    ...(stats.totalMinimum > 0
      ? [{ label: 'Asgari ödemeler (+)', value: stats.totalMinimum, tone: 'text-indigo-600' }]
      : []),
  ];

  return (
    <div className="space-y-6 no-print">
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
    </div>
  );
}
