import type { MetadataRoute } from 'next';
import {
  CREWLEDGER_PWA_ICON_192,
  CREWLEDGER_PWA_ICON_512,
} from '@/lib/brand';
import {
  PERSONNEL_PWA_SPLASH_BG,
  PERSONNEL_PWA_THEME,
} from '@/lib/personnel-pwa-brand';

export type PwaAppVariant = 'personnel' | 'admin';

/** PWA ikon/manifest önbelleğini kırmak için — değişince artır */
const PWA_ASSET_VERSION = '7';

/** Göreli URL — kurulum yapılan origin ile aynı host (beyaz kenar / 404 önlemi) */
function appIconUrl(size: 192 | 512) {
  const base = size === 192 ? CREWLEDGER_PWA_ICON_192 : CREWLEDGER_PWA_ICON_512;
  return `${base}?v=${PWA_ASSET_VERSION}`;
}

function baseIcons(): MetadataRoute.Manifest['icons'] {
  const icon192 = appIconUrl(192);
  const icon512 = appIconUrl(512);
  return [
    { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
}

export function buildPersonnelManifest(): MetadataRoute.Manifest {
  const icon = appIconUrl(192);
  return {
    id: '/personnel-panel?v=7',
    name: 'CrewLedger Personel',
    short_name: 'CrewLedger',
    description:
      'Şantiye personeli için yoklama, yevmiye, mesai ve maaş özeti. Construction crew self-service app.',
    start_url: '/personnel-panel/login',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: PERSONNEL_PWA_SPLASH_BG,
    theme_color: PERSONNEL_PWA_THEME,
    lang: 'tr',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    prefer_related_applications: false,
    icons: baseIcons(),
    shortcuts: [
      {
        name: 'QR Yoklama',
        short_name: 'Yoklama',
        url: '/personnel-panel/yoklama',
        icons: [{ src: icon, sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Özet',
        short_name: 'Özet',
        url: '/personnel-panel',
        icons: [{ src: icon, sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}

export function buildAdminManifest(): MetadataRoute.Manifest {
  const icon = appIconUrl(192);
  return {
    id: '/admin-panel?v=7',
    name: 'CrewLedger Yönetici',
    short_name: 'CL Yönetici',
    description:
      'Şantiye yöneticileri için personel, yevmiye, bordro ve proje yönetimi. Construction workforce admin.',
    start_url: '/admin-panel/login',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    lang: 'tr',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    prefer_related_applications: false,
    icons: baseIcons(),
    shortcuts: [
      {
        name: 'Projeler',
        short_name: 'Projeler',
        url: '/admin-panel',
        icons: [{ src: icon, sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Başvuru Onay',
        short_name: 'Başvurular',
        url: '/admin-panel/basvuru-onay',
        icons: [{ src: icon, sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}

export function manifestForVariant(variant: PwaAppVariant): MetadataRoute.Manifest {
  return variant === 'admin' ? buildAdminManifest() : buildPersonnelManifest();
}
