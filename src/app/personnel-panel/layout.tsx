import type { Metadata, Viewport } from 'next';
import { PersonnelDisplayProvider } from '@/lib/personnel-display-preferences';
import { PersonnelIntroGate } from '@/components/personnel/PersonnelIntroGate';
import { PersonnelPanelChrome } from '@/components/personnel/PersonnelPanelChrome';
import { PERSONNEL_APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';
import { PERSONNEL_PWA_STARTUP_IMAGES, PERSONNEL_PWA_THEME } from '@/lib/personnel-pwa-brand';
import { getTwaOrigin } from '@/lib/twa-config';

const ORIGIN = getTwaOrigin();

export const metadata: Metadata = {
  title: 'CrewLedger Personel',
  description: 'Yoklama, yevmiye ve maaş özeti — şantiye personel paneli.',
  applicationName: 'CrewLedger Personel',
  manifest: '/manifest-personnel.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CrewLedger',
  },
  icons: {
    icon: [{ url: `${PERSONNEL_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
    apple: [{ url: `${PERSONNEL_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'color-scheme': 'dark',
  },
};

export const viewport: Viewport = {
  themeColor: PERSONNEL_PWA_THEME,
  colorScheme: 'dark',
};

export default function PersonnelPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {PERSONNEL_PWA_STARTUP_IMAGES.map(({ href, media }) => (
        <link
          key={`${href}-${media}`}
          rel="apple-touch-startup-image"
          href={`${ORIGIN}${href}`}
          media={media}
        />
      ))}
      <PersonnelDisplayProvider>
        <PersonnelIntroGate>
          <PersonnelPanelChrome>{children}</PersonnelPanelChrome>
        </PersonnelIntroGate>
      </PersonnelDisplayProvider>
    </>
  );
}
