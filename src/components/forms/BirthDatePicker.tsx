'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import dayjs from 'dayjs';
import {
  composeBirthDate,
  formatBirthMonthLabel,
  getEligibleBirthDays,
  getEligibleBirthMonths,
  getEligibleBirthYears,
  getMaxBirthDate,
  MIN_CONSTRUCTION_AGE,
} from '@/lib/age-validation';
import { formatString } from '@/lib/strings/format';

type Props = {
  value: string;
  onChange: (value: string) => void;
  inputClass?: string;
  labelClass?: string;
  required?: boolean;
};

function parseValue(value: string) {
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) {
    return { year: '', month: '', day: '' };
  }
  return {
    year: String(parsed.year()),
    month: String(parsed.month() + 1),
    day: String(parsed.date()),
  };
}

export function BirthDatePicker({
  value,
  onChange,
  inputClass = '',
  labelClass = '',
  required,
}: Props) {

  const strings = useRegistryStrings('components/forms/BirthDatePicker');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const years = useMemo(() => getEligibleBirthYears(), []);
  const maxBirthLabel = getMaxBirthDate().format('DD.MM.YYYY');

  useEffect(() => {
    const parsed = parseValue(value);
    setYear(parsed.year);
    setMonth(parsed.month);
    setDay(parsed.day);
  }, [value]);

  const monthOptions = useMemo(() => {
    if (!year) return [];
    return getEligibleBirthMonths(Number(year));
  }, [year]);

  const dayOptions = useMemo(() => {
    if (!year || !month) return [];
    return getEligibleBirthDays(Number(year), Number(month));
  }, [year, month]);

  const emitIfComplete = (y: string, m: string, d: string) => {
    if (!y || !m || !d) {
      onChange('');
      return;
    }
    onChange(composeBirthDate(Number(y), Number(m), Number(d)));
  };

  const handleYearChange = (nextYear: string) => {
    setYear(nextYear);
    let nextMonth = month;
    let nextDay = day;

    if (nextYear) {
      const months = getEligibleBirthMonths(Number(nextYear));
      if (!nextMonth || !months.includes(Number(nextMonth))) {
        nextMonth = '';
        nextDay = '';
      } else if (nextDay) {
        const days = getEligibleBirthDays(Number(nextYear), Number(nextMonth));
        if (!days.includes(Number(nextDay))) {
          nextDay = '';
        }
      }
    } else {
      nextMonth = '';
      nextDay = '';
    }

    setMonth(nextMonth);
    setDay(nextDay);
    emitIfComplete(nextYear, nextMonth, nextDay);
  };

  const handleMonthChange = (nextMonth: string) => {
    setMonth(nextMonth);
    let nextDay = day;

    if (nextMonth && year) {
      const days = getEligibleBirthDays(Number(year), Number(nextMonth));
      if (!nextDay || !days.includes(Number(nextDay))) {
        nextDay = '';
      }
    } else {
      nextDay = '';
    }

    setDay(nextDay);
    emitIfComplete(year, nextMonth, nextDay);
  };

  const handleDayChange = (nextDay: string) => {
    setDay(nextDay);
    emitIfComplete(year, month, nextDay);
  };

  const selectClass = `${inputClass} appearance-none`;

  return (
    <div>
      <label className={labelClass}>
        {strings.label} {required ? '*' : ''}
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select
          className={selectClass}
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          required={required}
          aria-label={strings.yearAriaLabel}
        >
          <option value="">{strings.yearPlaceholder}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          required={required}
          disabled={!year}
          aria-label={strings.monthAriaLabel}
        >
          <option value="">{strings.monthPlaceholder}</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {formatBirthMonthLabel(m)}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          required={required}
          disabled={!year || !month}
          aria-label={strings.dayAriaLabel}
        >
          <option value="">{strings.dayPlaceholder}</option>
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
        {formatString(strings.hint, { minAge: MIN_CONSTRUCTION_AGE, maxBirthDate: maxBirthLabel })}
      </p>
    </div>
  );
}
