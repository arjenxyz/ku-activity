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
    <div className="no-print">
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Maaş dökümü</p>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors"
            >
              <FiPrinter className="w-4 h-4 shrink-0" />
              <span className="text-left leading-tight">
                <span className="block">Detaylı döküm</span>
                <span className="block text-[10px] font-normal text-blue-500/80 dark:text-blue-400/70">
                  Yazdır veya PDF kaydet
                </span>
              </span>
            </button>
          )}
        </div>
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
