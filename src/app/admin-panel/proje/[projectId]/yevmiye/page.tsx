'use client';

import { useParams } from 'next/navigation';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useState } from 'react';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AttendanceQrPanel } from '@/components/project/AttendanceQrPanel';
import { AlertBanner } from '@/components/project/AlertBanner';
import { EmployeeSelect } from '@/components/project/EmployeeSelect';
import { JobSelectField } from '@/components/project/JobSelectField';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { ApiHttpError, postWorkLog } from '@/lib/project-api';
import { MESAI_OPTIONS, type MesaiType } from '@/lib/work-log';
import { btnPrimary, labelClass, inputClass, cardClass } from '@/components/project/ui';

export default function YevmiyePage() {
  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/yevmiye/page');
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const { jobs } = useProjectJobs(projectId);

  const [employeeId, setEmployeeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [amount, setAmount] = useState<0.5 | 1>(1);
  const [mesaiType, setMesaiType] = useState<MesaiType>('none');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId) {
      setError(strings.selectEmployeeError);
      return;
    }
    setLoading(true);
    const payload = {
      employeeId,
      date,
      amount,
      mesaiType: (amount < 1 ? 'none' : mesaiType) as typeof mesaiType,
      description: description || undefined,
      jobId: jobId || null,
    };
    try {
      await postWorkLog(projectId, payload);
      setSuccess(strings.successSaved);
      setDescription('');
      setMesaiType('none');
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 409) {
        if (window.confirm(strings.overwriteConfirm)) {
          try {
            await postWorkLog(projectId, { ...payload, allowOverwrite: true });
            setSuccess(strings.successSaved);
            setDescription('');
            setMesaiType('none');
          } catch (retryErr) {
            setError(retryErr instanceof Error ? retryErr.message : strings.saveFailed);
          }
        }
      } else {
        setError(err instanceof Error ? err.message : strings.saveFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 sm:max-w-2xl">
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <AttendanceQrPanel projectId={projectId} />

      <form onSubmit={handleManualSubmit} className={`${cardClass} p-4 sm:p-6`}>
        <h2 className="mb-4 text-base font-semibold text-slate-900">{strings.formTitle}</h2>
        <div className="space-y-4">
          <EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} />

          <div>
            <label className={labelClass}>{strings.labelDate}</label>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>{strings.labelAmount}</label>
            <select
              className={inputClass}
              value={amount}
              onChange={(e) => {
                const next = Number(e.target.value) === 0.5 ? 0.5 : 1;
                setAmount(next);
                if (next < 1) setMesaiType('none');
              }}
            >
              <option value={1}>{strings.amountFull}</option>
              <option value={0.5}>{strings.amountHalf}</option>
            </select>
          </div>

          {jobs.length > 0 && <JobSelectField jobs={jobs} value={jobId} onChange={setJobId} />}

          <div>
            <label className={labelClass}>{strings.labelMesaiType}</label>
            <select
              className={inputClass}
              value={mesaiType}
              disabled={amount < 1}
              onChange={(e) => setMesaiType(e.target.value as MesaiType)}
            >
              <option value="none">{strings.mesaiNone}</option>
              {MESAI_OPTIONS.filter((o) => o.value !== 'none').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">{strings.mesaiHint}</p>
          </div>

          <div>
            <label className={labelClass}>{strings.labelNote}</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className={btnPrimary} disabled={loading || empLoading}>
            {loading ? strings.saving : strings.saveButton}
          </button>
        </div>
      </form>
    </div>
  );
}
