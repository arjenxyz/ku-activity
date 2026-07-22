'use client';

import { useState, useEffect } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';
import type { Project, ProjectFormData, ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';
import { FiX, FiSettings, FiAlertTriangle } from 'react-icons/fi';
import { updateProject, startProjectClosure } from '@/api/projects';
import {
  COMMON_PROJECT_TIMEZONES,
  DEFAULT_PROJECT_TIMEZONE,
  guessTimezoneFromLocation,
} from '@/lib/attendance-window';

type Props = {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
};

export const ProjectSettingsModal = ({
  project,
  isOpen,
  onClose,
  onUpdate,
}: Props) => {
  const strings = useRegistryStrings('components/modals/ProjectSettingsModal');
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project.name,
    code: project.code || '',
    location: project.location || '',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    description: project.description || '',
    status: project.status,
    work_start_time: project.work_start_time?.slice(0, 5) ?? '08:00',
    work_end_time: project.work_end_time?.slice(0, 5) ?? '17:00',
    timezone: project.timezone ?? DEFAULT_PROJECT_TIMEZONE,
    auto_attendance_enabled: project.auto_attendance_enabled ?? false,
  });
  const [showClosureConfirm, setShowClosureConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: project.name,
      code: project.code || '',
      location: project.location || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      description: project.description || '',
      status: project.status,
      work_start_time: project.work_start_time?.slice(0, 5) ?? '08:00',
      work_end_time: project.work_end_time?.slice(0, 5) ?? '17:00',
      timezone: project.timezone ?? DEFAULT_PROJECT_TIMEZONE,
      auto_attendance_enabled: project.auto_attendance_enabled ?? false,
    });
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await updateProject(project.id, formData);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      onUpdate({ ...project, ...formData });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartClosure = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: closureError } = await startProjectClosure(project.id);
      if (closureError) {
        setError(closureError.message);
        return;
      }
      onUpdate({ ...project, status: 'archived' });
      onClose();
      router.replace('/admin-panel');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full bg-white dark:bg-slate-950 text-sm';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label={strings.closeAriaLabel}
        >
          <FiX className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FiSettings />
          {strings.title}
        </h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 rounded-xl">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{strings.nameLabel}</label>
            <input type="text" className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{strings.codeLabel}</label>
              <input type="text" className={inputClass} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{strings.statusLabel}</label>
              <select className={inputClass} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}>
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                  <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{strings.locationLabel}</label>
            <input
              type="text"
              className={inputClass}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              onBlur={() => {
                const guessed = guessTimezoneFromLocation(formData.location);
                if (guessed && formData.timezone === DEFAULT_PROJECT_TIMEZONE) {
                  setFormData((f) => ({ ...f, timezone: guessed }));
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{strings.timezoneLabel}</label>
            <select
              className={inputClass}
              value={formData.timezone ?? DEFAULT_PROJECT_TIMEZONE}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              {COMMON_PROJECT_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {strings.timezoneHint}
            </p>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={Boolean(formData.auto_attendance_enabled)}
              onChange={(e) =>
                setFormData({ ...formData, auto_attendance_enabled: e.target.checked })
              }
            />
            <span>
              <span className="block text-sm font-medium">{strings.autoAttendanceLabel}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{strings.autoAttendanceHint}</span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{strings.startLabel}</label>
              <input type="date" className={inputClass} value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{strings.endLabel}</label>
              <input type="date" className={inputClass} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{strings.workStartLabel}</label>
              <input
                type="time"
                className={inputClass}
                value={formData.work_start_time ?? '08:00'}
                onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{strings.workEndLabel}</label>
              <input
                type="time"
                className={inputClass}
                value={formData.work_end_time ?? '17:00'}
                onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{strings.descriptionLabel}</label>
            <textarea className={inputClass} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
              {isSubmitting ? strings.submitSaving : strings.submit}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl text-sm font-medium">
              {strings.cancel}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
          {!showClosureConfirm ? (
            <button type="button" onClick={() => setShowClosureConfirm(true)} className="w-full flex items-center justify-center gap-2 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 py-2.5 rounded-xl text-sm font-medium">
              <FiAlertTriangle /> {strings.startClosure}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                <FiAlertTriangle className="shrink-0 mt-0.5" /> {strings.closureWarning}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={handleStartClosure} disabled={isSubmitting} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                  {isSubmitting ? strings.closureSaving : strings.closureConfirm}
                </button>
                <button type="button" onClick={() => setShowClosureConfirm(false)} className="flex-1 border py-2.5 rounded-xl text-sm font-medium">
                  {strings.closureCancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
