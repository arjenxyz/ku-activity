import type { Metadata, Viewport } from 'next';
import { AdminPanelLayout } from '@/components/dashboard/AdminPanelLayout';
import { ADMIN_APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';
import { getTwaOrigin } from '@/lib/twa-config';

const ORIGIN = getTwaOrigin();

export const metadata: Metadata = {
  title: 'CrewLedger Yönetici',
  description: 'Personel, yevmiye, bordro ve şantiye yönetimi.',
  applicationName: 'CrewLedger Yönetici',
  manifest: '/manifest-admin.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CL Yönetici',
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
  themeColor: '#0f172a',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
