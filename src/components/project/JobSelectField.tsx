'use client';

import { inputClass, labelClass } from '@/components/project/ui';
import strings from '@json/src/components/project/JobSelectField.json';

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
  label = strings.defaultLabel,
  hint = strings.defaultHint,
  className,
}: Props) {
  if (jobs.length === 0) return null;

  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{strings.notSelected}</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.name}
            {j.status === 'completed' ? strings.completedSuffix : ''}
          </option>
        ))}
      </select>
      {hint ? <p className="text-xs text-slate-500 mt-2">{hint}</p> : null}
    </div>
  );
}
