'use client';

import { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import {
  deleteProjectRecord,
  updateProjectRecord,
  type ProjectRecordType,
} from '@/lib/project-api';
import { JobSelectField } from '@/components/project/JobSelectField';
import { inputClass, labelClass, btnPrimary, btnSecondary } from './ui';
import strings from '@json/src/components/project/RecordEditActions.json';

type JobOption = { id: string; name: string; status?: string };

type BaseRecord = {
  id: string;
  date: string;
  amount: number;
  description?: string | null;
  approved?: boolean;
  job_id?: string | null;
};

type Props = {
  projectId: string;
  recordType: ProjectRecordType;
  record: BaseRecord;
  onChanged: () => void;
  showApproved?: boolean;
  jobs?: JobOption[];
};

export function RecordEditActions({
  projectId,
  recordType,
  record,
  onChanged,
  showApproved,
  jobs = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: record.date,
    amount: String(record.amount),
    description: record.description ?? '',
    approved: record.approved ?? true,
    jobId: record.job_id ?? '',
  });

  const showJobSelect =
    jobs.length > 0 && (recordType === 'work-logs' || recordType === 'deductions');

  const openEdit = () => {
    setForm({
      date: record.date,
      amount: String(record.amount),
      description: record.description ?? '',
      approved: record.approved ?? true,
      jobId: record.job_id ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateProjectRecord(projectId, recordType, record.id, {
        date: form.date,
        amount: Number(form.amount),
        description: form.description || null,
        ...(showApproved ? { approved: form.approved } : {}),
        ...(showJobSelect ? { jobId: form.jobId || null } : {}),
      });
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.updateFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(strings.deleteConfirm)) return;
    setLoading(true);
    setError(null);
    try {
      await deleteProjectRecord(projectId, recordType, record.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.deleteFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={openEdit}
          disabled={loading}
          className="p-1.5 rounded-md text-slate-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          title={strings.editTitle}
        >
          <FiEdit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="p-1.5 rounded-md text-slate-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
          title={strings.deleteTitle}
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900">{strings.modalTitle}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClass}>{strings.dateLabel}</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  {recordType === 'work-logs' ? strings.daysLabel : strings.amountLabel}
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min={0}
                  step={recordType === 'work-logs' ? '0.5' : '1'}
                  required
                />
              </div>
              {showApproved && (
                <div className="flex items-center gap-2">
                  <input
                    id="approved"
                    type="checkbox"
                    checked={form.approved}
                    onChange={(e) => setForm({ ...form, approved: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="approved" className="text-sm text-slate-700">
                    {strings.approvedLabel}
                  </label>
                </div>
              )}
              {showJobSelect && (
                <JobSelectField
                  jobs={jobs}
                  value={form.jobId}
                  onChange={(jobId) => setForm({ ...form, jobId })}
                  label={strings.jobLabel}
                  hint={strings.jobHint}
                />
              )}
              <div>
                <label className={labelClass}>{strings.descriptionLabel}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" className={btnPrimary} disabled={loading}>
                  {loading ? strings.submitSaving : strings.submit}
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  {strings.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
