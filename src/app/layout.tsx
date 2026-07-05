import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWARegister } from '@/components/pwa/PWARegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { LocaleShell } from '@/components/i18n/LocaleShell';
import trLayoutStrings from '@json/src/app/layout.json';
import enLayoutStrings from '@json/en/src/app/layout.json';
import { APP_NAME, CREWLEDGER_APP_ICON } from '@/lib/brand';
import { formatString } from '@/lib/strings/format';
import { pickStrings } from '@/lib/i18n/pickStrings';
import { LOCALE_COOKIE, resolveRequestLocale } from '@/lib/i18n/locale';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';
import {
  ADMIN_CRITICAL_CSS,
  ADMIN_MOBILE_THEME_COLOR,
  ADMIN_ROUTE_HEADER,
  getAdminIntroBootScript,
} from '@/lib/admin-intro-boot-script';
import { ADMIN_INTRO_IMAGE, ADMIN_PWA_SPLASH_BG } from '@/lib/admin-pwa-brand';
import {
  getPersonnelIntroBootScript,
  PERSONNEL_CRITICAL_CSS,
  PERSONNEL_MOBILE_THEME_COLOR,
  PERSONNEL_ROUTE_HEADER,
} from '@/lib/personnel-intro-boot-script';
import { PERSONNEL_INTRO_IMAGE, PERSONNEL_PWA_SPLASH_BG } from '@/lib/personnel-pwa-brand';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const headerList = await headers();
  const locale = resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get('accept-language')
  );
  const strings = pickStrings(locale, trLayoutStrings, enLayoutStrings);

  return {
    title: formatString(strings.title, { appName: APP_NAME }),
    description: strings.description,
    applicationName: formatString(strings.applicationName, { appName: APP_NAME }),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: formatString(strings.appleWebAppTitle, { appName: APP_NAME }),
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [{ url: `${CREWLEDGER_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
      apple: [{ url: `${CREWLEDGER_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const locale = resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get('accept-language')
  );
  const isPersonnelRoute = headerList.get(PERSONNEL_ROUTE_HEADER) === '1';
  const isAdminRoute = headerList.get(ADMIN_ROUTE_HEADER) === '1';
  const isPwaIntroRoute = isPersonnelRoute || isAdminRoute;
  const pwaSplashBg = isPersonnelRoute ? PERSONNEL_PWA_SPLASH_BG : ADMIN_PWA_SPLASH_BG;
  const pwaSurfaceStyle = isPwaIntroRoute
    ? ({ backgroundColor: pwaSplashBg, colorScheme: 'dark' as const })
    : undefined;

  return (
    <html lang={locale} style={pwaSurfaceStyle} suppressHydrationWarning>
      <head>
        {isPersonnelRoute ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: PERSONNEL_CRITICAL_CSS }} />
            <meta name="color-scheme" content="dark" />
            <meta name="theme-color" content={PERSONNEL_MOBILE_THEME_COLOR} />
            <link rel="preload" as="image" href={PERSONNEL_INTRO_IMAGE} fetchPriority="high" />
          </>
        ) : null}
        {isAdminRoute ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: ADMIN_CRITICAL_CSS }} />
            <meta name="color-scheme" content="dark" />
            <meta name="theme-color" content={ADMIN_MOBILE_THEME_COLOR} />
            <link rel="preload" as="image" href={ADMIN_INTRO_IMAGE} fetchPriority="high" />
          </>
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 ${
          isPwaIntroRoute
            ? 'text-gray-100'
            : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
        }`}
        style={pwaSurfaceStyle}
        suppressHydrationWarning
      >
        {isPersonnelRoute ? (
          <Script id="personnel-intro-boot-root" strategy="beforeInteractive">
            {getPersonnelIntroBootScript()}
          </Script>
        ) : null}
        {isAdminRoute ? (
          <Script id="admin-intro-boot-root" strategy="beforeInteractive">
            {getAdminIntroBootScript()}
          </Script>
        ) : null}
        <PWARegister />
        <LocaleShell initialLocale={locale}>
          {children}
          <InstallPrompt />
        </LocaleShell>
      </body>
    </html>
  );
}
