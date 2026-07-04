export type Locale = 'tr' | 'en';

export const LOCALES: Locale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: Locale = 'tr';
export const LOCALE_COOKIE = 'crewledger_locale';
export const LOCALE_STORAGE_KEY = 'crewledger_locale';

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
