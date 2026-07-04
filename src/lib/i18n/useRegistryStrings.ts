'use client';

import { useLocale } from './LocaleProvider';
import { getRegistryStrings, type StringRegistryKey } from './strings-registry';

export function useRegistryStrings<K extends StringRegistryKey>(key: K) {
  const { locale } = useLocale();
  return getRegistryStrings(key, locale);
}
