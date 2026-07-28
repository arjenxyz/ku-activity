'use client';

import { useLocale } from './LocaleProvider';
import { pickStrings, type LocaleBundle } from './pickStrings';

export function useLocalizedStrings<T>(bundle: LocaleBundle<T>): T {
  const { locale } = useLocale();
  return pickStrings(locale, bundle);
}
