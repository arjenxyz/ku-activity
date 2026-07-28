'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  localeCookieOptions,
  localeDirection,
  parseLocale,
  type Locale,
} from './locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  isReady: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection(locale);
}

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${localeCookieOptions(locale).maxAge}; samesite=lax`;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore storage failures
  }
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stored: Locale | null = null;
    try {
      stored = parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    } catch {
      stored = null;
    }

    const cookieMatch = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
    const cookieLocale = parseLocale(cookieMatch?.split('=')[1]);

    const resolved = stored ?? cookieLocale ?? initialLocale;
    setLocaleState(resolved);
    applyDocumentLocale(resolved);
    setIsReady(true);
  }, [initialLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      applyDocumentLocale(next);
      persistLocale(next);
      window.dispatchEvent(new CustomEvent('crewledger:locale-change', { detail: next }));
      router.refresh();
    },
    [router]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      isReady,
    }),
    [locale, setLocale, isReady]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
