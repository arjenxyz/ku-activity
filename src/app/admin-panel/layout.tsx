import type { Metadata, Viewport } from 'next';
import { AdminPanelLayout } from '@/components/dashboard/AdminPanelLayout';
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
    icon: [{ url: `${ORIGIN}/icons/admin/192`, sizes: '192x192', type: 'image/png' }],
    apple: [{ url: `${ORIGIN}/icons/admin/192`, sizes: '192x192', type: 'image/png' }],
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
