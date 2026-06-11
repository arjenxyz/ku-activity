'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { QueryFilters } from '@/components/project/QueryFilters';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass } from '@/components/project/ui';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { fetchRecords } from '@/lib/project-api';
import { formatMoney, formatDate } from '@/lib/format';

type Row = { id: string; date: string; amount: number; description?: string | null };

export default function PersonelSorgulamaPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [workLogs, setWorkLogs] = useState<Row[]>([]);
  const [advances, setAdvances] = useState<Row[]>([]);
  const [minimum, setMinimum] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employee = employees.find((e) => e.id === employeeId);

  useEffect(() => {
    if (!employeeId) {
      setWorkLogs([]);
      setAdvances([]);
      setMinimum([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      fetchRecords(projectId, 'work-logs', { employeeId, month }),
      fetchRecords(projectId, 'deductions', { employeeId, month, deductionType: 'advance' }),
      fetchRecords(projectId, 'minimum-wages', { employeeId, month }),
    ])
      .then(([w, a, m]) => {
        setWorkLogs(w.records ?? []);
        setAdvances(a.records ?? []);
        setMinimum(m.records ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, employeeId, month]);

  const workDays = workLogs.reduce((s, r) => s + Number(r.amount), 0);
  const gross = employee ? workDays * Number(employee.daily_wage) : 0;
  const totalAdv = advances.reduce((s, r) => s + Number(r.amount), 0);
  const totalMin = minimum.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <ProjectPageHeader
        title="Personel Sorgulaması"
        description="Seçili personelin aylık özetini görüntüleyin."
      />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}

      <QueryFilters
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        month={month}
        onMonthChange={setMonth}
      />

      {!employeeId ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          Özet için personel seçin.
        </div>
      ) : loading ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>Yükleniyor…</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Çalışılan Gün', value: workDays.toString() },
              { label: 'Brüt', value: formatMoney(gross) },
              { label: 'Avans', value: formatMoney(totalAdv) },
              { label: 'Asgari', value: formatMoney(totalMin) },
            ].map((s) => (
              <div key={s.label} className={`${cardClass} p-4`}>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {[
            { title: 'Yevmiyeler', rows: workLogs },
            { title: 'Avanslar', rows: advances },
            { title: 'Asgari Ödemeler', rows: minimum },
          ].map((section) => (
            <div key={section.title} className={cardClass}>
              <div className="px-4 py-3 border-b border-slate-200 font-medium text-slate-800">
                {section.title}
              </div>
              {section.rows.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Kayıt yok.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {section.rows.map((r) => (
                    <li key={r.id} className="px-4 py-3 flex justify-between gap-3 text-sm">
                      <span className="text-slate-600">{formatDate(r.date)}</span>
                      <span className="font-medium text-slate-900">
                        {section.title === 'Yevmiyeler'
                          ? `${r.amount} gün`
                          : formatMoney(Number(r.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
