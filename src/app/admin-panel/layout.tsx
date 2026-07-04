import type { Metadata, Viewport } from 'next';
import strings from '@json/src/app/admin-panel/layout.json';
import { AdminIntroGate } from '@/components/admin/AdminIntroGate';
import { AdminPanelLayout } from '@/components/dashboard/AdminPanelLayout';
import { ADMIN_APP_ICON, APP_NAME } from '@/lib/brand';
import { ADMIN_PWA_STARTUP_IMAGES, ADMIN_PWA_THEME } from '@/lib/admin-pwa-brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';
import { formatString } from '@/lib/strings/format';
import { getTwaOrigin } from '@/lib/twa-config';

const ORIGIN = getTwaOrigin();

export const metadata: Metadata = {
  title: formatString(strings.title, { appName: APP_NAME }),
  description: strings.description,
  applicationName: formatString(strings.applicationName, { appName: APP_NAME }),
  manifest: '/manifest-admin.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: strings.appleWebAppTitle,
  },
  icons: {
    icon: [{ url: `${ORIGIN}${ADMIN_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
    apple: [{ url: `${ORIGIN}${ADMIN_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: ADMIN_PWA_THEME,
  colorScheme: 'dark',
};

export default function AdminPanelRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {ADMIN_PWA_STARTUP_IMAGES.map(({ href, media }) => (
        <link
          key={`${href}-${media}`}
          rel="apple-touch-startup-image"
          href={`${ORIGIN}${href}`}
          media={media}
        />
      ))}
      <AdminIntroGate>
        <AdminPanelLayout>{children}</AdminPanelLayout>
      </AdminIntroGate>
    </>
  );
}
