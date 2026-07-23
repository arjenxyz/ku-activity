'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FiAlertTriangle, FiCheck } from 'react-icons/fi';
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

type DayErrorReport = {
  id: string;
  employee_id: string;
  work_date: string;
  categories: string[];
  note: string;
  status: 'open' | 'resolved';
  created_at: string;
  employees?: { name: string | null } | null;
};

export default function PersonelItirazlariPage() {
  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/itirazlar/page');
  const { projectId } = useParams() as { projectId: string };
  const { employees, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [records, setRecords] = useState<DisputedWorkLog[]>([]);
  const [dayReports, setDayReports] = useState<DayErrorReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const categoryLabel = useCallback(
    (key: string) => {
      const map = strings.dayCategories as Record<string, string>;
      return map[key] ?? key;
    },
    [strings.dayCategories]
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchRecords(projectId, 'work-logs', {
      employeeId: employeeId || undefined,
      month,
      disputed: 'true',
    })
      .then((d) => setRecords((d.records ?? []) as DisputedWorkLog[]))
      .catch((e) => setError(e instanceof Error ? e.message : strings.loadFailed))
      .finally(() => setLoading(false));
  }, [projectId, employeeId, month, strings.loadFailed]);

  const loadDayReports = useCallback(() => {
    setDayLoading(true);
    setDayError(null);
    fetch(`/api/admin/projects/${encodeURIComponent(projectId)}/day-reports?status=open`, {
      credentials: 'same-origin',
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { error?: string }).error || strings.dayLoadFailed);
        let list = ((data as { reports?: DayErrorReport[] }).reports ?? []) as DayErrorReport[];
        if (employeeId) list = list.filter((r) => r.employee_id === employeeId);
        if (month) {
          list = list.filter((r) => String(r.work_date).startsWith(month));
        }
        setDayReports(list);
      })
      .catch((e) => setDayError(e instanceof Error ? e.message : strings.dayLoadFailed))
      .finally(() => setDayLoading(false));
  }, [projectId, employeeId, month, strings.dayLoadFailed]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadDayReports();
  }, [loadDayReports]);

  async function resolveDayReport(id: string) {
    setResolvingId(id);
    setDayError(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(projectId)}/day-reports/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || strings.dayResolveFailed);
      setDayReports((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setDayError(e instanceof Error ? e.message : strings.dayResolveFailed);
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />

      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {dayError && <AlertBanner type="error" message={dayError} />}

      <AlertBanner type="warning" message={strings.warningBanner} />

      <QueryFilters
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        month={month}
        onMonthChange={setMonth}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{strings.daySectionTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{strings.daySectionHint}</p>
        </div>

        {dayLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            {strings.dayLoading}
          </div>
        ) : dayReports.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {strings.dayEmpty}
          </div>
        ) : (
          <ul className="space-y-4">
            {dayReports.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-2 border-b border-sky-100 bg-sky-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {r.employees?.name ?? strings.defaultEmployeeName}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">{formatDate(r.work_date)}</p>
                  </div>
                  <span className="inline-flex self-start items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-sky-900">
                    <FiAlertTriangle className="h-3.5 w-3.5" />
                    {strings.dayOpenBadge}
                  </span>
                </div>
                <div className="space-y-4 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap gap-1.5">
                    {(r.categories ?? []).map((c) => (
                      <span
                        key={c}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {categoryLabel(c)}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{r.note}</p>
                  <button
                    type="button"
                    disabled={resolvingId === r.id}
                    onClick={() => void resolveDayReport(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <FiCheck className="h-4 w-4" />
                    {resolvingId === r.id ? strings.dayResolving : strings.dayResolve}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{strings.workSectionTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{strings.workSectionHint}</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            {strings.loading}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <FiAlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-600">{strings.emptyTitle}</p>
            <p className="mt-2 text-xs text-slate-400">
              {strings.emptyHintPrefix}{' '}
              <Link
                href={`/admin-panel/proje/${projectId}/sorgulama/yevmiye`}
                className="text-blue-600 hover:underline"
              >
                {strings.emptyHintLink}
              </Link>{' '}
              {strings.emptyHintSuffix}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {records.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-2 border-b border-amber-100 bg-amber-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {r.employees?.name ?? strings.defaultEmployeeName}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {formatDate(r.date)} ·{' '}
                      {formatWorkLogSummary(Number(r.amount), r.mesai_type ?? null)}
                    </p>
                  </div>
                  <span className="inline-flex self-start items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                    <FiAlertTriangle className="h-3.5 w-3.5" />
                    {strings.disputeOpenBadge}
                  </span>
                </div>
                <div className="space-y-4 px-4 py-4 sm:px-5">
                  <AdminDisputeNote record={r} />
                  {r.description && (
                    <p className="text-xs text-slate-500">
                      {strings.adminNotePrefix} {r.description}
                    </p>
                  )}
                  <AdminWorkLogDisputeActions projectId={projectId} record={r} onChanged={load} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
