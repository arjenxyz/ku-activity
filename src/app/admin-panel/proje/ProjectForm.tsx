'use client';


import { useState, useEffect } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCheck, FiKey, FiX } from 'react-icons/fi';
import { verificationCodeMailto } from '@/lib/support-email';
import { createProject, updateProject, fetchProjectById } from '../../lib/proje/projectService';
import type { ProjectFormData, ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';

const defaultForm: ProjectFormData = {
  name: '',
  code: '',
  location: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  description: '',
  status: 'active',
  verificationCode: '',
};

export default function ProjectForm({
  editingId,
  onSuccess,
  onCancel,
}: {
  editingId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const strings = useRegistryStrings('app/admin-panel/proje/ProjectForm');
  const [formData, setFormData] = useState<ProjectFormData>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) {
      setFormData(defaultForm);
      return;
    }
    fetchProjectById(editingId)
      .then((project) => {
        if (!project) {
          setError(strings.notFound);
          return;
        }
        setFormData({
          name: project.name,
          code: project.code || '',
          location: project.location || '',
          start_date: project.start_date || '',
          end_date: project.end_date || '',
          description: project.description || '',
          status: project.status,
        });
      })
      .catch(() => setError(strings.loadFailed));
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateProject(editingId, formData);
      } else {
        await createProject(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.saveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const inputClass =
    'block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden mb-6 border border-slate-200/80 dark:border-slate-800">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold">
          {editingId ? strings.editTitle : strings.newTitle}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-center gap-2">
            <FiX className="shrink-0" />
            {error}
          </div>
        )}

        {!editingId && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-3">
            <div className="flex items-start gap-2">
              <FiKey className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {strings.verificationCodeLabel}
                </label>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
                  {strings.verificationCodeIntro}{' '}
                  <a href={verificationCodeMailto()} className="font-semibold underline hover:no-underline">
                    {strings.verificationCodeLink}
                  </a>
                  .
                </p>
              </div>
            </div>
            <input
              type="text"
              name="verificationCode"
              id="verificationCode"
              value={formData.verificationCode || ''}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder={strings.verificationCodePlaceholder}
              autoComplete="off"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">{strings.nameLabel}</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder={strings.namePlaceholder} />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1.5">{strings.codeLabel}</label>
            <input type="text" name="code" id="code" value={formData.code} onChange={handleChange} className={inputClass} placeholder={strings.codePlaceholder} />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1.5">{strings.statusLabel}</label>
            <select name="status" id="status" value={formData.status} onChange={handleChange} required className={inputClass}>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1.5">{strings.locationLabel}</label>
            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={inputClass} placeholder={strings.locationPlaceholder} />
          </div>
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium mb-1.5">{strings.startDateLabel}</label>
            <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium mb-1.5">{strings.endDateLabel}</label>
            <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">{strings.descriptionLabel}</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={inputClass} placeholder={strings.descriptionPlaceholder} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
            <FiX className="w-4 h-4" />
            {strings.cancel}
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
            <FiCheck className="w-4 h-4" />
            {isSubmitting ? strings.saving : editingId ? strings.update : strings.create}
          </button>
        </div>
      </form>
    </div>
  );
}
