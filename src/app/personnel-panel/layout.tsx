import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { PersonnelDisplayProvider } from '@/lib/personnel-display-preferences';
import { PersonnelIntroGate } from '@/components/personnel/PersonnelIntroGate';
import { PersonnelPanelChrome } from '@/components/personnel/PersonnelPanelChrome';
import { PERSONNEL_APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';
import { PERSONNEL_INTRO_STORAGE_KEY } from '@/lib/personnel-intro';
import {
  PERSONNEL_INTRO_IMAGE,
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
    icon: [{ url: `${PERSONNEL_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
    apple: [{ url: `${PERSONNEL_APP_ICON}?v=${PWA_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' }],
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
      <link rel="preload" as="image" href={PERSONNEL_INTRO_IMAGE} fetchPriority="high" />
      <Script id="personnel-intro-bridge" strategy="beforeInteractive">
        {`(function(){try{var k='${PERSONNEL_INTRO_STORAGE_KEY}';var p=location.pathname;if(p.indexOf('/personnel-panel/basvuru')===0)return;if(sessionStorage.getItem(k)==='1')return;if(!window.matchMedia('(max-width:639px)').matches)return;document.documentElement.style.backgroundColor='${PERSONNEL_PWA_SPLASH_BG}';var boot=document.createElement('div');boot.id='cl-intro-boot';boot.setAttribute('aria-busy','true');boot.style.cssText='position:fixed;inset:0;z-index:9998;background:${PERSONNEL_PWA_SPLASH_BG};display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 1.5rem max(1.75rem,env(safe-area-inset-bottom));pointer-events:none';boot.innerHTML='<p style="margin:0 0 1rem;font:500 15px system-ui,sans-serif;color:rgba(255,255,255,.9);letter-spacing:.02em">Uygulama hazırlanıyor…</p><div style="width:min(72vw,220px);height:4px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:.5rem"><div style="width:38%;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(56,189,248,.2),#38bdf8,rgba(56,189,248,.2))"></div></div>';document.documentElement.appendChild(boot);}catch(e){}})();`}
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
