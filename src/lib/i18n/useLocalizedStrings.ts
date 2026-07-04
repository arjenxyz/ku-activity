'use client';

import { useLocale } from './LocaleProvider';
import { pickStrings } from './pickStrings';

export function useLocalizedStrings<T>(tr: T, en: T): T {
  const { locale } = useLocale();
  return pickStrings(locale, tr, en);
}
