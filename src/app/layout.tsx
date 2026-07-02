import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWARegister } from '@/components/pwa/PWARegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { CREWLEDGER_APP_ICON } from '@/lib/brand';

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
    icon: [{ url: `${CREWLEDGER_APP_ICON}?v=8`, sizes: '512x512', type: 'image/png' }],
    apple: [{ url: `${CREWLEDGER_APP_ICON}?v=8`, sizes: '512x512', type: 'image/png' }],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <PWARegister />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
