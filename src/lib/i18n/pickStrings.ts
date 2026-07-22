import type { Locale } from './locale';
import { contentLocale } from './locale';

export function pickStrings<T>(locale: Locale, tr: T, en: T): T {
  return contentLocale(locale) === 'en' ? en : tr;
}
