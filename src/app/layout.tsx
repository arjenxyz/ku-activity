import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWARegister } from '@/components/pwa/PWARegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ArjenDev | İnşaat Personel Yönetim Sistemi',
  description:
    'Yevmiye, avans, proje takibi ve maaş hesaplamaları için modern HR yönetim platformu. İnşaat sektörüne özel dijital çözümler.',
  applicationName: 'ArjenDev',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ArjenDev',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: [{ url: '/api/pwa-icon/192', sizes: '192x192', type: 'image/png' }],
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
