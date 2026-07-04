import type { Locale } from './locale';

export function pickStrings<T>(locale: Locale, tr: T, en: T): T {
  return locale === 'en' ? en : tr;
}
