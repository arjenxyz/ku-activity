'use client';

import { FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';
import { getWorkLogApprovalStatus } from '@/lib/work-log';
import type { WorkLog } from '@/lib/personnel-stats';

type Props = {
  workLogs: WorkLog[];
};

export function PersonnelFairnessCard({ workLogs }: Props) {
  let confirmed = 0;
  let pendingEmployee = 0;
  let pendingAdmin = 0;
  let unrecorded = 0;

  for (const log of workLogs) {
    const status = getWorkLogApprovalStatus(log);
    if (status === 'confirmed') confirmed += 1;
    else if (status === 'pending_employee') pendingEmployee += 1;
    else if (status === 'pending_admin') pendingAdmin += 1;
    else unrecorded += 1;
  }

  const items = [
    {
      label: 'Onaylı gün',
      value: confirmed,
      hint: 'Her iki taraf da onayladı — ödemeye dahil',
      icon: <FiCheckCircle className="w-5 h-5 text-emerald-600" />,
      accent: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
    },
    {
      label: 'Sizin onayınız',
      value: pendingEmployee,
      hint: 'Yönetici girdi — siz onaylayınca kesinleşir',
      icon: <FiClock className="w-5 h-5 text-amber-600" />,
      accent: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
    },
    {
      label: 'Yönetici onayı',
      value: pendingAdmin,
      hint: 'Siz bildirdiniz — yönetici onaylayınca kesinleşir',
      icon: <FiUsers className="w-5 h-5 text-blue-600" />,
      accent: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Adil kayıt sistemi — çift onay
      </p>
      <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
        Hiçbir yevmiye günü tek taraflı kesinleşmez. Yönetici ve siz aynı günü onayladığınızda kayıt{' '}
        <strong>Onaylı</strong> olur ve maaş hesabına yansır.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-3 ${item.accent}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {item.label}
              </span>
              {item.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{item.value}</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.hint}</p>
          </div>
        ))}
      </div>

      {unrecorded > 0 && (
        <p className="text-xs text-slate-500 mt-3">
          Bu dönemde {unrecorded} kayıt henüz onay sürecinde değil veya eksik.
        </p>
      )}

      <ol className="mt-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
        <li>Gün bildirimi (siz veya yönetici)</li>
        <li>Karşı tarafın onayı</li>
        <li>Onaylı statü → maaş hesabına yansıma</li>
      </ol>
    </div>
  );
}
