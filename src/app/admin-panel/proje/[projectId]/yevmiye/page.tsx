'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AttendanceQrPanel } from '@/components/project/AttendanceQrPanel';
import { AlertBanner } from '@/components/project/AlertBanner';
import { EmployeeSelect } from '@/components/project/EmployeeSelect';
import { JobSelectField } from '@/components/project/JobSelectField';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { fetchRecords, updateProjectRecord } from '@/lib/project-api';
import { MESAI_OPTIONS } from '@/lib/work-log';
import { btnPrimary, labelClass, inputClass, cardClass } from '@/components/project/ui';

export default function YevmiyePage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const { jobs } = useProjectJobs(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [mesaiType, setMesaiType] = useState<'ceyrek' | 'yarim' | 'tam'>('ceyrek');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workLogId, setWorkLogId] = useState<string | null>(null);

  const loadWorkLog = useCallback(async () => {
    if (!employeeId || !date) {
      setWorkLogId(null);
      return;
    }
    try {
      const data = await fetchRecords(projectId, 'work-logs', {
        employeeId,
        month: date.slice(0, 7),
      });
      const records = (data.records ?? []) as Array<{ id: string; date: string }>;
      const match = records.find((r) => r.date === date);
      setWorkLogId(match?.id ?? null);
    } catch {
      setWorkLogId(null);
    }
  }, [projectId, employeeId, date]);

  useEffect(() => {
    void loadWorkLog();
  }, [loadWorkLog]);

  const handleMesaiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId) {
      setError('Personel seçin.');
      return;
    }
    if (!workLogId) {
      setError('Seçilen personelin bu tarihte yoklama kaydı yok. Önce QR ile yoklama yapılmalı.');
      return;
    }
    setLoading(true);
    try {
      await updateProjectRecord(projectId, 'work-logs', workLogId, {
        mesaiType,
        description: description || null,
        jobId: jobId || null,
      });
      setSuccess('Mesai kaydedildi.');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader
        title="Yoklama & Yevmiye"
        description="Günlük QR ile tam gün yoklama. Mesaiyi buradan manuel ekleyin."
      />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <AttendanceQrPanel projectId={projectId} />

      <form onSubmit={handleMesaiSubmit} className={`${cardClass} p-4 sm:p-6 mb-6 max-w-xl`}>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Mesai ekle</h2>
        <div className="space-y-4">
          <EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} />

          <div>
            <label className={labelClass}>Tarih *</label>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {employeeId && date && !workLogId && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              Bu personel seçili günde henüz QR ile yoklama yapmadı.
            </p>
          )}

          {jobs.length > 0 && <JobSelectField jobs={jobs} value={jobId} onChange={setJobId} />}

          <div>
            <label className={labelClass}>Mesai türü *</label>
            <select
              className={inputClass}
              value={mesaiType}
              onChange={(e) => setMesaiType(e.target.value as 'ceyrek' | 'yarim' | 'tam')}
            >
              {MESAI_OPTIONS.filter((o) => o.value !== 'none').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Çeyrek = günlük yevmiyenin %25&apos;i · Yarım = %50 · Tam = bir günlük yevmiye ek
            </p>
          </div>

          <div>
            <label className={labelClass}>Not (isteğe bağlı)</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className={btnPrimary} disabled={loading || empLoading || !workLogId}>
            {loading ? 'Kaydediliyor…' : 'Mesai kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
