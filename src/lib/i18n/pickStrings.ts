import type { Locale } from './locale';

export type LocaleBundle<T> = Record<Locale, T>;

export function pickStrings<T>(locale: Locale, bundle: LocaleBundle<T>): T {
  return bundle[locale] ?? bundle.en ?? bundle.tr;
}
