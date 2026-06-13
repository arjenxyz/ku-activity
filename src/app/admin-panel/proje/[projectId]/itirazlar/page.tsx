'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FiAlertTriangle } from 'react-icons/fi';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { QueryFilters } from '@/components/project/QueryFilters';
import { AlertBanner } from '@/components/project/AlertBanner';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { fetchRecords } from '@/lib/project-api';
import { formatDate } from '@/lib/format';
import { formatWorkLogSummary } from '@/lib/work-log';
import {
  AdminDisputeNote,
  AdminWorkLogDisputeActions,
  type DisputedWorkLog,
} from '@/components/admin/AdminWorkLogDisputeActions';

export default function PersonelItirazlariPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [records, setRecords] = useState<DisputedWorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchRecords(projectId, 'work-logs', {
      employeeId: employeeId || undefined,
      month,
      disputed: 'true',
    })
      .then((d) => setRecords((d.records ?? []) as DisputedWorkLog[]))
      .catch((e) => setError(e instanceof Error ? e.message : 'Yüklenemedi'))
      .finally(() => setLoading(false));
  }, [projectId, employeeId, month]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <ProjectPageHeader
        title="Personel İtirazları"
        description="Personelin reddettiği yoklama / yevmiye kayıtları. Düzeltip yeniden gönderebilir veya silebilirsiniz."
      />

      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}

      <AlertBanner
        type="warning"
        message="Personel bir kaydı reddettiğinde burada görünür. Düzelt ve yeniden gönder dediğinizde kayıt personelin onayına tekrar düşer."
      />

      <QueryFilters
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        month={month}
        onMonthChange={setMonth}
      />

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          İtirazlar yükleniyor…
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <FiAlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Bu dönemde açık personel itirazı yok.</p>
          <p className="text-xs text-slate-400 mt-2">
            Farklı ay seçin veya{' '}
            <Link
              href={`/admin-panel/proje/${projectId}/sorgulama/yevmiye`}
              className="text-blue-600 hover:underline"
            >
              yevmiye sorgulama
            </Link>
            sayfasından kayıtları inceleyin.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {records.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-amber-200/80 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-4 sm:px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{r.employees?.name ?? 'Personel'}</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {formatDate(r.date)} ·{' '}
                    {formatWorkLogSummary(Number(r.amount), r.mesai_type ?? null)}
                  </p>
                </div>
                <span className="inline-flex self-start items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                  <FiAlertTriangle className="w-3.5 h-3.5" />
                  İtiraz açık
                </span>
              </div>
              <div className="px-4 sm:px-5 py-4 space-y-4">
                <AdminDisputeNote record={r} />
                {r.description && (
                  <p className="text-xs text-slate-500">Yönetici notu: {r.description}</p>
                )}
                <AdminWorkLogDisputeActions projectId={projectId} record={r} onChanged={load} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
