'use client';

import { FiInfo, FiUpload } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import {
  DEKONT_DEDUCTION_LABELS,
  DEFAULT_WAGE_POLICY,
  PRORATION_MODE_LABELS,
  YEVMIYE_TRIGGER_LABELS,
  type DekontDeductionMode,
  type WagePolicy,
  type YevmiyePaymentTrigger,
} from '@/types/wage-policy';
import { getOfficialMonthlyMinimumWageGross } from '@/lib/minimum-wage';
import { cardClass, labelClass, inputClass, btnPrimary } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';
import { formatString } from '@/lib/strings/format';

type Props = {
  value: WagePolicy;
  onChange: (policy: WagePolicy) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  saving?: boolean;
  showDekontSection?: boolean;
  title?: string;
  subtitle?: string;
};

export function WagePolicyForm({
  value,
  onChange,
  onSubmit,
  loading,
  saving,
  showDekontSection = true,
  title,
  subtitle,
}: Props) {

  const strings = useRegistryStrings('components/project/WagePolicyForm');
  const resolvedTitle = title ?? strings.defaultTitle;
  const resolvedSubtitle = subtitle ?? strings.defaultSubtitle;
  const systemDefault = getOfficialMonthlyMinimumWageGross();

  const toggleTrigger = (trigger: YevmiyePaymentTrigger) => {
    const set = new Set(value.yevmiyePaymentTriggers);
    if (set.has(trigger)) set.delete(trigger);
    else set.add(trigger);
    const next = Array.from(set);
    onChange({
      ...value,
      yevmiyePaymentTriggers: next.length ? next : ['month_end'],
    });
  };

  if (loading) {
    return (
      <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>{strings.loading}</div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{resolvedTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">{resolvedSubtitle}</p>
      </div>

      <section className={`${cardClass} p-4 sm:p-6 space-y-4`}>
        <h2 className="text-base font-semibold text-slate-900">{strings.yevmiyeSectionTitle}</h2>
        <p className="text-sm text-slate-600">{strings.yevmiyeSectionHint}</p>
        <div className="flex flex-col gap-2">
          {(Object.keys(YEVMIYE_TRIGGER_LABELS) as YevmiyePaymentTrigger[]).map((key) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={value.yevmiyePaymentTriggers.includes(key)}
                onChange={() => toggleTrigger(key)}
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-800">{YEVMIYE_TRIGGER_LABELS[key]}</span>
            </label>
          ))}
        </div>
        <div>
          <label className={labelClass}>{strings.notesLabel}</label>
          <textarea
            className={`${inputClass} min-h-[72px]`}
            value={value.yevmiyePaymentNotes}
            onChange={(e) => onChange({ ...value, yevmiyePaymentNotes: e.target.value })}
            placeholder={strings.notesPlaceholder}
          />
        </div>
      </section>

      <section className={`${cardClass} p-4 sm:p-6 space-y-4`}>
        <h2 className="text-base font-semibold text-slate-900">{strings.minimumSectionTitle}</h2>
        <div className={`rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex gap-3 text-sm text-indigo-950`}>
          <FiInfo className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            {formatString(strings.minimumInfo, { amount: formatMoney(systemDefault) })}
          </p>
        </div>

        <div>
          <label className={labelClass}>{strings.minimumReferenceLabel}</label>
          <input
            type="number"
            className={inputClass}
            step="0.01"
            min="0"
            placeholder={formatString(strings.minimumReferencePlaceholder, {
              amount: formatMoney(systemDefault),
            })}
            value={value.officialMonthlyMinimum ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                officialMonthlyMinimum: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={value.prorationFromHireDate}
            onChange={(e) => onChange({ ...value, prorationFromHireDate: e.target.checked })}
            className="rounded border-slate-300"
          />
          {strings.prorationCheckbox}
        </label>

        <div>
          <label className={labelClass}>{strings.prorationModeLabel}</label>
          <select
            className={inputClass}
            value={value.prorationMode}
            onChange={(e) =>
              onChange({
                ...value,
                prorationMode: e.target.value as WagePolicy['prorationMode'],
              })
            }
          >
            {(Object.keys(PRORATION_MODE_LABELS) as WagePolicy['prorationMode'][]).map((k) => (
              <option key={k} value={k}>
                {PRORATION_MODE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {showDekontSection && (
        <section className={`${cardClass} p-4 sm:p-6 space-y-4 opacity-90`}>
          <div className="flex items-center gap-2">
            <FiUpload className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">{strings.dekontSectionTitle}</h2>
          </div>
          <p className="text-sm text-slate-600">{strings.dekontSectionHint}</p>
          <label className="flex items-center gap-3 text-sm text-slate-500">
            <input type="checkbox" disabled checked={false} className="rounded" />
            {strings.dekontAutoCheckbox}
          </label>
          <div>
            <label className={labelClass}>{strings.dekontDeductionsLabel}</label>
            <select
              className={inputClass}
              value={value.dekontDeductionMode}
              onChange={(e) =>
                onChange({
                  ...value,
                  dekontDeductionMode: e.target.value as DekontDeductionMode,
                })
              }
            >
              {(Object.keys(DEKONT_DEDUCTION_LABELS) as DekontDeductionMode[]).map((k) => (
                <option key={k} value={k}>
                  {DEKONT_DEDUCTION_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{strings.dekontNotesLabel}</label>
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={value.dekontNotes}
              onChange={(e) => onChange({ ...value, dekontNotes: e.target.value })}
              placeholder={strings.dekontNotesPlaceholder}
            />
          </div>
        </section>
      )}

      <button type="submit" className={btnPrimary} disabled={saving}>
        {saving ? strings.submitSaving : strings.submit}
      </button>
    </form>
  );
}

export function emptyWagePolicy(): WagePolicy {
  return { ...DEFAULT_WAGE_POLICY };
}
