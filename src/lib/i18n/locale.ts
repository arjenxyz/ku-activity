export type Locale = 'tr' | 'en';

export const LOCALES: Locale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: Locale = 'tr';
export const LOCALE_COOKIE = 'crewledger_locale';
export const LOCALE_STORAGE_KEY = 'crewledger_locale';

/** Dil seçici menüsü — yeni dil eklerken buraya ekleyin (çeviri dosyaları ayrı). */
export type LocaleOption = {
  id: Locale;
  short: string;
  /** Dilin kendi adıyla yazımı (Türkçe, English, Deutsch…) */
  nativeLabel: string;
  /** Menüde ikincil satır — her zaman İngilizce ad */
  englishName: string;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: 'tr', short: 'TR', nativeLabel: 'Türkçe', englishName: 'Turkish' },
  { id: 'en', short: 'EN', nativeLabel: 'English', englishName: 'English' },
];

export function parseLocale(value: string | null | undefined): Locale {
  if (value === 'en') return 'en';
  return 'tr';
}

export function resolveLocaleFromAcceptLanguage(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
  if (primary.startsWith('en')) return 'en';
  return 'tr';
}

export function resolveRequestLocale(
  cookieValue?: string | null,
  acceptLanguage?: string | null
): Locale {
  if (cookieValue) return parseLocale(cookieValue);
  return resolveLocaleFromAcceptLanguage(acceptLanguage);
}

export function localeCookieOptions(locale: Locale) {
  return {
    name: LOCALE_COOKIE,
    value: locale,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax' as const,
  };
}
