import dayjs from 'dayjs';
import strings from '@json/src/lib/age-validation.json';
import { formatString } from '@/lib/strings/format';

/** İnşaat sahasında çalışma için asgari yaş */
export const MIN_CONSTRUCTION_AGE = 18;

/** Doğum tarihi seçicide gösterilecek en eski yıl (yaklaşık üst yaş sınırı) */
export const MAX_BIRTH_AGE = 80;

/** Bugün itibarıyla en geç doğum tarihi (dahil) — 18 yaşını doldurmuş olmalı */
export function getMaxBirthDate() {
  return dayjs().subtract(MIN_CONSTRUCTION_AGE, 'year').startOf('day');
}

export function getMinBirthYear() {
  return dayjs().year() - MAX_BIRTH_AGE;
}

export function getMaxBirthYear() {
  return getMaxBirthDate().year();
}

export function isConstructionEligibleBirthDate(date: string): boolean {
  const parsed = dayjs(date, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) return false;
  return !parsed.isAfter(getMaxBirthDate(), 'day');
}

export function getAgeFromBirthDate(date: string): number {
  return dayjs().diff(dayjs(date, 'YYYY-MM-DD', true), 'year');
}

export function constructionAgeErrorMessage(): string {
  return formatString(strings.constructionAgeError, { minAge: MIN_CONSTRUCTION_AGE });
}

export function getEligibleBirthYears(): number[] {
  const min = getMinBirthYear();
  const max = getMaxBirthYear();
  return Array.from({ length: max - min + 1 }, (_, i) => max - i);
}

export function getEligibleBirthMonths(year: number): number[] {
  const max = getMaxBirthDate();
  const lastMonth = year === max.year() ? max.month() + 1 : 12;
  return Array.from({ length: lastMonth }, (_, i) => i + 1);
}

export function getEligibleBirthDays(year: number, month: number): number[] {
  const max = getMaxBirthDate();
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
  const lastDay =
    year === max.year() && month === max.month() + 1 ? max.date() : daysInMonth;
  return Array.from({ length: lastDay }, (_, i) => i + 1);
}

export function formatBirthMonthLabel(month: number): string {
  return strings.months[month - 1] ?? String(month);
}

export function composeBirthDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
