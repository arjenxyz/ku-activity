import type { Locale } from './locale';
import { contentLocale } from './locale';

export function pickStrings<T>(locale: Locale, tr: T, en: T, hu?: T): T {
  const content = contentLocale(locale);
  if (content === 'hu') return hu ?? en;
  if (content === 'en') return en;
  return tr;
}
