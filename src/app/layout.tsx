import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWARegister } from '@/components/pwa/PWARegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { CREWLEDGER_APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';
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

export const metadata: Metadata = {
  title: 'CrewLedger | Construction Workforce Platform',
  description:
    'Attendance, daily wages, contracts, and crew management for construction sites. Built with Next.js and Supabase.',
  applicationName: 'CrewLedger',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CrewLedger',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: `${CREWLEDGER_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
    apple: [{ url: `${CREWLEDGER_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
  },
};

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
  const isPersonnelRoute = headerList.get(PERSONNEL_ROUTE_HEADER) === '1';
  const personnelSurfaceStyle = isPersonnelRoute
    ? ({ backgroundColor: PERSONNEL_PWA_SPLASH_BG, colorScheme: 'dark' as const })
    : undefined;

  return (
    <html lang="tr" style={personnelSurfaceStyle} suppressHydrationWarning>
      <head>
        {isPersonnelRoute ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: PERSONNEL_CRITICAL_CSS }} />
            <meta name="color-scheme" content="dark" />
            <meta name="theme-color" content={PERSONNEL_MOBILE_THEME_COLOR} />
            <link rel="preload" as="image" href={PERSONNEL_INTRO_IMAGE} fetchPriority="high" />
          </>
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 ${
          isPersonnelRoute
            ? 'text-gray-100'
            : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
        }`}
        style={personnelSurfaceStyle}
        suppressHydrationWarning
      >
        {isPersonnelRoute ? (
          <Script id="personnel-intro-boot-root" strategy="beforeInteractive">
            {getPersonnelIntroBootScript()}
          </Script>
        ) : null}
        <PWARegister />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
