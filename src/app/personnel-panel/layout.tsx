import type { Metadata, Viewport } from 'next';
import { PersonnelDisplayProvider } from '@/lib/personnel-display-preferences';
import { PersonnelPanelChrome } from '@/components/personnel/PersonnelPanelChrome';
import { getTwaOrigin } from '@/lib/twa-config';

const ORIGIN = getTwaOrigin();

export const metadata: Metadata = {
  title: 'CrewLedger Personel',
  description: 'Yoklama, yevmiye ve maaş özeti — şantiye personel paneli.',
  applicationName: 'CrewLedger Personel',
  manifest: '/manifest-personnel.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CrewLedger',
  },
  icons: {
    icon: [{ url: `${ORIGIN}/icons/personnel/192`, sizes: '192x192', type: 'image/png' }],
    apple: [{ url: `${ORIGIN}/icons/personnel/192`, sizes: '192x192', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function PersonnelPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonnelDisplayProvider>
      <PersonnelPanelChrome>{children}</PersonnelPanelChrome>
    </PersonnelDisplayProvider>
  );
}
