import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { PersonnelDisplayProvider } from '@/lib/personnel-display-preferences';
import { PersonnelIntroGate } from '@/components/personnel/PersonnelIntroGate';
import { PersonnelPanelChrome } from '@/components/personnel/PersonnelPanelChrome';
import { CREWLEDGER_PWA_ICON_512 } from '@/lib/brand';
import { PERSONNEL_INTRO_STORAGE_KEY } from '@/lib/personnel-intro';
import {
  PERSONNEL_PWA_SPLASH_BG,
  PERSONNEL_PWA_STARTUP_IMAGES,
  PERSONNEL_PWA_THEME,
} from '@/lib/personnel-pwa-brand';
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
    icon: [{ url: `${CREWLEDGER_PWA_ICON_512}?v=7`, sizes: '512x512', type: 'image/png' }],
    apple: [{ url: `${CREWLEDGER_PWA_ICON_512}?v=7`, sizes: '512x512', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: PERSONNEL_PWA_THEME,
};

export default function PersonnelPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script id="personnel-intro-bridge" strategy="beforeInteractive">
        {`(function(){try{var p=location.pathname;if(p.indexOf('/personnel-panel/basvuru')===0)return;if(sessionStorage.getItem('${PERSONNEL_INTRO_STORAGE_KEY}')==='1')return;if(!window.matchMedia('(max-width:639px)').matches)return;document.documentElement.style.backgroundColor='${PERSONNEL_PWA_SPLASH_BG}';}catch(e){}})();`}
      </Script>
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
