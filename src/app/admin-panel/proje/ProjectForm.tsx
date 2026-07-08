'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCheck, FiX } from 'react-icons/fi';
import { createProject, updateProject, fetchProjectById, fetchProjectQuota } from '../../lib/proje/projectService';
import type { ProjectFormData, ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';
import { formatString } from '@/lib/strings/format';
import type { AdminProjectQuota } from '@/lib/project-admin-quota';
import { HonorIconTile, type HonorIconName, type HonorIconTheme } from '@/components/icons/HonorIcons';
import { DEFAULT_PROJECT_TIMEZONE, DEFAULT_WORK_START, DEFAULT_WORK_END } from '@/lib/attendance-window';
import {
  TURKEY_PROVINCE_NAMES,
  getDistrictsForProvince,
  formatLocation,
  parseLocation,
} from '@/lib/turkey-locations';

const defaultForm: ProjectFormData = {
  name: '',
  code: '',
  location: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  description: '',
  status: 'active',
  work_start_time: DEFAULT_WORK_START,
  work_end_time: DEFAULT_WORK_END,
  timezone: DEFAULT_PROJECT_TIMEZONE,
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
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [quota, setQuota] = useState<AdminProjectQuota | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingId) return;
    fetchProjectQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  }, [editingId]);

  useEffect(() => {
    if (!editingId) {
      setFormData(defaultForm);
      setProvince('');
      setDistrict('');
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
          work_start_time: project.work_start_time?.slice(0, 5) || DEFAULT_WORK_START,
          work_end_time: project.work_end_time?.slice(0, 5) || DEFAULT_WORK_END,
          timezone: project.timezone || DEFAULT_PROJECT_TIMEZONE,
        });
        const parsed = parseLocation(project.location);
        setProvince(parsed.province);
        setDistrict(parsed.district);
      })
      .catch(() => setError(strings.loadFailed));
  }, [editingId, strings.loadFailed, strings.notFound]);

  const districts = useMemo(() => getDistrictsForProvince(province), [province]);

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict('');
    setFormData((prev) => ({ ...prev, location: formatLocation(value) }));
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setFormData((prev) => ({ ...prev, location: formatLocation(province, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingId && quota && !quota.canCreate) {
      setError(strings.activeProjectLimit);
      return;
    }
    if (formData.work_start_time && formData.work_end_time && formData.work_start_time === formData.work_end_time) {
      setError(strings.workTimeInvalid);
      return;
    }
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

  const limitReached = !editingId && quota != null && !quota.canCreate;
  const fieldsDisabled = limitReached;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <HonorIconTile name="briefcase" theme="indigo" size="md" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#0E1548] sm:text-lg">
            {editingId ? strings.editTitle : strings.newTitle}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{strings.formSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
            <FiX className="shrink-0" />
            {error}
          </div>
        )}

        {!editingId && quota?.limit != null && (
          <p className="text-sm text-slate-500">
            {formatString(strings.quotaHint, {
              count: quota.operationalCount,
              limit: quota.limit,
            })}
          </p>
        )}

        {limitReached && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {strings.activeProjectLimit}
          </div>
        )}

        <div className={fieldsDisabled ? 'space-y-4 opacity-60 pointer-events-none' : 'space-y-4'}>
          <FormSection icon="briefcase" theme="indigo" title={strings.sectionInfo}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2" htmlFor="name" label={strings.nameLabel}>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={fieldClass}
                  placeholder={strings.namePlaceholder}
                  disabled={fieldsDisabled}
                />
              </Field>
              <Field htmlFor="code" label={strings.codeLabel}>
                <input
                  type="text"
                  name="code"
                  id="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder={strings.codePlaceholder}
                  disabled={fieldsDisabled}
                />
              </Field>
              <Field htmlFor="status" label={strings.statusLabel}>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className={fieldClass}
                  disabled={fieldsDisabled}
                >
                  {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection icon="globe" theme="teal" title={strings.sectionLocation}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field htmlFor="province" label={strings.provinceLabel}>
                <select
                  id="province"
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className={fieldClass}
                  disabled={fieldsDisabled}
                >
                  <option value="">{strings.provincePlaceholder}</option>
                  {TURKEY_PROVINCE_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="district" label={strings.districtLabel}>
                <select
                  id="district"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className={fieldClass}
                  disabled={fieldsDisabled || !province}
                >
                  <option value="">
                    {province ? strings.districtPlaceholder : strings.districtSelectProvinceFirst}
                  </option>
                  {districts.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection icon="clock" theme="blue" title={strings.sectionSchedule} hint={strings.scheduleHint}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field htmlFor="start_date" label={strings.startDateLabel}>
                <input
                  type="date"
                  name="start_date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={fieldsDisabled}
                />
              </Field>
              <Field htmlFor="end_date" label={strings.endDateLabel}>
                <input
                  type="date"
                  name="end_date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={fieldsDisabled}
                />
              </Field>
              <Field htmlFor="work_start_time" label={strings.workStartLabel}>
                <input
                  type="time"
                  name="work_start_time"
                  id="work_start_time"
                  value={formData.work_start_time ?? DEFAULT_WORK_START}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={fieldsDisabled}
                />
              </Field>
              <Field htmlFor="work_end_time" label={strings.workEndLabel}>
                <input
                  type="time"
                  name="work_end_time"
                  id="work_end_time"
                  value={formData.work_end_time ?? DEFAULT_WORK_END}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={fieldsDisabled}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection icon="document" theme="slate" title={strings.sectionNotes}>
            <Field htmlFor="description" label={strings.descriptionLabel}>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={fieldClass}
                placeholder={strings.descriptionPlaceholder}
                disabled={fieldsDisabled}
              />
            </Field>
          </FormSection>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:py-2.5"
          >
            <FiX className="h-4 w-4" />
            {strings.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || limitReached}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060] disabled:opacity-50 sm:py-2.5"
          >
            <FiCheck className="h-4 w-4" />
            {isSubmitting ? strings.saving : editingId ? strings.update : strings.create}
          </button>
        </div>
      </form>
    </div>
  );
}

const fieldClass =
  'block w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0E1548]/30 disabled:bg-slate-50 disabled:text-slate-400';

function FormSection({
  icon,
  theme,
  title,
  hint,
  children,
}: {
  icon: HonorIconName;
  theme: HonorIconTheme;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 sm:p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <HonorIconTile name={icon} theme={theme} size="sm" muted />
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
          {hint ? <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  htmlFor,
  label,
  className,
  children,
}: {
  htmlFor: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
