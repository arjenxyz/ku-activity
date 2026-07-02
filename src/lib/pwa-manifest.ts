import type { MetadataRoute } from 'next';
import {
  PERSONNEL_PWA_SPLASH_BG,
  PERSONNEL_PWA_THEME,
} from '@/lib/personnel-pwa-brand';
import { getTwaOrigin } from '@/lib/twa-config';

export type PwaAppVariant = 'personnel' | 'admin';

const ORIGIN = getTwaOrigin();
/** PWA ikon/manifest önbelleğini kırmak için — değişince artır */
const PWA_ASSET_VERSION = '3';

function iconUrl(variant: PwaAppVariant, size: 192 | 512) {
  return `${ORIGIN}/icons/${variant}/${size}?v=${PWA_ASSET_VERSION}`;
}

function baseIcons(variant: PwaAppVariant): MetadataRoute.Manifest['icons'] {
  const icons: MetadataRoute.Manifest['icons'] = [
    {
      src: iconUrl(variant, 192),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl(variant, 512),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
  ];

  if (variant === 'personnel') {
    icons.push({
      src: `${ORIGIN}/icons/personnel/maskable/512?v=${PWA_ASSET_VERSION}`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    });
  } else {
    icons.push({
      src: iconUrl(variant, 512),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    });
  }

  return icons;
}

export function buildPersonnelManifest(): MetadataRoute.Manifest {
  return {
    id: '/personnel-panel?v=3',
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
    icons: baseIcons('personnel'),
    shortcuts: [
      {
        name: 'QR Yoklama',
        short_name: 'Yoklama',
        url: '/personnel-panel/yoklama',
        icons: [{ src: iconUrl('personnel', 192), sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Özet',
        short_name: 'Özet',
        url: '/personnel-panel',
        icons: [{ src: iconUrl('personnel', 192), sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}

export function buildAdminManifest(): MetadataRoute.Manifest {
  return {
    id: '/admin-panel',
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
    icons: baseIcons('admin'),
    shortcuts: [
      {
        name: 'Projeler',
        short_name: 'Projeler',
        url: '/admin-panel',
        icons: [{ src: iconUrl('admin', 192), sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Başvuru Onay',
        short_name: 'Başvurular',
        url: '/admin-panel/basvuru-onay',
        icons: [{ src: iconUrl('admin', 192), sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}

export function manifestForVariant(variant: PwaAppVariant): MetadataRoute.Manifest {
  return variant === 'admin' ? buildAdminManifest() : buildPersonnelManifest();
}
