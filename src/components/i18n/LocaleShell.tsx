'use client';

import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';

export function LocaleShell({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>;
}
