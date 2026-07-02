import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { PersonnelDisplayProvider } from '@/lib/personnel-display-preferences';
import { PersonnelIntroGate } from '@/components/personnel/PersonnelIntroGate';
import { PersonnelPanelChrome } from '@/components/personnel/PersonnelPanelChrome';
import {
  PERSONNEL_INTRO_SPLASH_BG,
  PERSONNEL_INTRO_STORAGE_KEY,
} from '@/lib/personnel-intro-splash';
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
  themeColor: PERSONNEL_INTRO_SPLASH_BG,
};

export default function PersonnelPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script id="personnel-intro-splash-bridge" strategy="beforeInteractive">
        {`(function(){try{var p=location.pathname;if(p.indexOf('/personnel-panel/basvuru')===0)return;if(sessionStorage.getItem('${PERSONNEL_INTRO_STORAGE_KEY}')==='1')return;if(!window.matchMedia('(max-width:639px)').matches)return;document.documentElement.style.backgroundColor='${PERSONNEL_INTRO_SPLASH_BG}';}catch(e){}})();`}
      </Script>
      <PersonnelDisplayProvider>
        <PersonnelIntroGate>
          <PersonnelPanelChrome>{children}</PersonnelPanelChrome>
        </PersonnelIntroGate>
      </PersonnelDisplayProvider>
    </>
  );
}
