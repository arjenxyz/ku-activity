'use client';

import { inputClass, labelClass } from '@/components/project/ui';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

type JobOption = { id: string; name: string; status?: string };

type Props = {
  jobs: JobOption[];
  value: string;
  onChange: (jobId: string) => void;
  label?: string;
  hint?: string;
  className?: string;
};

export function JobSelectField({
  jobs,
  value,
  onChange,
  label,
  hint,
  className,
}: Props) {
  const strings = useRegistryStrings('components/project/JobSelectField');
  const resolvedLabel = label ?? strings.defaultLabel;
  const resolvedHint = hint ?? strings.defaultHint;

  if (jobs.length === 0) return null;

  return (
    <div className={className}>
      <label className={labelClass}>{resolvedLabel}</label>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{strings.notSelected}</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.name}
            {j.status === 'completed' ? strings.completedSuffix : ''}
          </option>
        ))}
      </select>
      {resolvedHint ? <p className="text-xs text-slate-500 mt-2">{resolvedHint}</p> : null}
    </div>
  );
}
