export type Locale =
  | 'tr'
  | 'en'
  | 'zh'
  | 'hi'
  | 'es'
  | 'fr'
  | 'ar'
  | 'bn'
  | 'pt'
  | 'ru'
  | 'ur'
  | 'id'
  | 'de'
  | 'ja'
  | 'hu';

/** Çeviri dosyası olan diller — diğerleri İngilizce metne düşer. */
export type ContentLocale = 'tr' | 'en';

export const LOCALES: Locale[] = [
  'tr',
  'en',
  'zh',
  'hi',
  'es',
  'fr',
  'ar',
  'bn',
  'pt',
  'ru',
  'ur',
  'id',
  'de',
  'ja',
  'hu',
];

export const DEFAULT_LOCALE: Locale = 'tr';
export const LOCALE_COOKIE = 'crewledger_locale';
export const LOCALE_STORAGE_KEY = 'crewledger_locale';

/** Dil seçici menüsü — bayrak + ad (çeviri JSON’u ayrı iş). */
export type LocaleOption = {
  id: Locale;
  short: string;
  /** ISO 3166-1 alpha-2 — bayrak görseli için */
  countryCode: string;
  /** Dilin kendi adıyla yazımı */
  nativeLabel: string;
  /** Menüde ikincil satır — İngilizce ad */
  englishName: string;
};

/** En çok konuşulan diller + Macarca (görünüm listesi). */
export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: 'tr', short: 'TR', countryCode: 'tr', nativeLabel: 'Türkçe', englishName: 'Turkish' },
  { id: 'en', short: 'EN', countryCode: 'gb', nativeLabel: 'English', englishName: 'English' },
  { id: 'zh', short: 'ZH', countryCode: 'cn', nativeLabel: '中文', englishName: 'Chinese' },
  { id: 'hi', short: 'HI', countryCode: 'in', nativeLabel: 'हिन्दी', englishName: 'Hindi' },
  { id: 'es', short: 'ES', countryCode: 'es', nativeLabel: 'Español', englishName: 'Spanish' },
  { id: 'fr', short: 'FR', countryCode: 'fr', nativeLabel: 'Français', englishName: 'French' },
  { id: 'ar', short: 'AR', countryCode: 'sa', nativeLabel: 'العربية', englishName: 'Arabic' },
  { id: 'bn', short: 'BN', countryCode: 'bd', nativeLabel: 'বাংলা', englishName: 'Bengali' },
  { id: 'pt', short: 'PT', countryCode: 'br', nativeLabel: 'Português', englishName: 'Portuguese' },
  { id: 'ru', short: 'RU', countryCode: 'ru', nativeLabel: 'Русский', englishName: 'Russian' },
  { id: 'ur', short: 'UR', countryCode: 'pk', nativeLabel: 'اردو', englishName: 'Urdu' },
  { id: 'id', short: 'ID', countryCode: 'id', nativeLabel: 'Bahasa Indonesia', englishName: 'Indonesian' },
  { id: 'de', short: 'DE', countryCode: 'de', nativeLabel: 'Deutsch', englishName: 'German' },
  { id: 'ja', short: 'JA', countryCode: 'jp', nativeLabel: '日本語', englishName: 'Japanese' },
  { id: 'hu', short: 'HU', countryCode: 'hu', nativeLabel: 'Magyar', englishName: 'Hungarian' },
];

export function flagImageUrl(countryCode: string, width = 40) {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}

const LOCALE_SET = new Set<string>(LOCALES);

/** UI metinleri için: TR → tr, diğer seçimler şimdilik EN. */
export function contentLocale(locale: Locale): ContentLocale {
  return locale === 'tr' ? 'tr' : 'en';
}

export function parseLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.trim().toLowerCase().split('-')[0];
  if (LOCALE_SET.has(normalized)) return normalized as Locale;
  return DEFAULT_LOCALE;
}

export function resolveLocaleFromAcceptLanguage(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
  const base = primary.split('-')[0];
  if (LOCALE_SET.has(base)) return base as Locale;
  return DEFAULT_LOCALE;
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
