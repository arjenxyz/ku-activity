import type { MetadataRoute } from 'next';
import { ADMIN_PWA_SPLASH_BG, ADMIN_PWA_THEME } from '@/lib/admin-pwa-brand';
import {
  PERSONNEL_PWA_SPLASH_BG,
  PERSONNEL_PWA_THEME,
} from '@/lib/personnel-pwa-brand';
import type { AppIconVariant } from '@/lib/brand';
import { notificationMonochromeIconPath } from '@/lib/brand';

export type PwaAppVariant = AppIconVariant;

/** PWA ikon/manifest önbelleğini kırmak için — değişince artır */
export const PWA_ASSET_VERSION = '17';

function iconUrl(variant: PwaAppVariant, size: 192 | 512, purpose: 'any' | 'maskable' = 'any') {
  if (purpose === 'maskable') {
    return `/icons/${variant}/maskable/${size}?v=${PWA_ASSET_VERSION}`;
  }
  return `/icons/${variant}/${size}?v=${PWA_ASSET_VERSION}`;
}

function iconsForVariant(variant: PwaAppVariant): MetadataRoute.Manifest['icons'] {
  const icon192 = iconUrl(variant, 192, 'any');
  const icon512 = iconUrl(variant, 512, 'any');
  const mask192 = iconUrl(variant, 192, 'maskable');
  const mask512 = iconUrl(variant, 512, 'maskable');
  const mono96 = `${notificationMonochromeIconPath(variant, 96)}?v=${PWA_ASSET_VERSION}`;
  return [
    { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: mask192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: mask512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: mono96, sizes: '96x96', type: 'image/png', purpose: 'monochrome' },
  ];
}

export function buildPersonnelManifest(): MetadataRoute.Manifest {
  const icon = iconUrl('personnel', 192);
  return {
    id: `/personnel-panel?v=${PWA_ASSET_VERSION}`,
    name: 'CrewLedger Personel',
    short_name: 'CrewLedger',
    description:
      'Şantiye personeli için yoklama, yevmiye, mesai ve maaş özeti. Construction crew self-service app.',
    start_url: '/personnel-panel',
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
    icons: iconsForVariant('personnel'),
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
  const icon = iconUrl('admin', 192);
  return {
    id: `/admin-panel?v=${PWA_ASSET_VERSION}`,
    name: 'CrewLedger Yönetici',
    short_name: 'CL Yönetici',
    description:
      'Şantiye yöneticileri için personel, yevmiye, bordro ve proje yönetimi. Construction workforce admin.',
    start_url: '/admin-panel/login',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: ADMIN_PWA_SPLASH_BG,
    theme_color: ADMIN_PWA_THEME,
    lang: 'tr',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    prefer_related_applications: false,
    icons: iconsForVariant('admin'),
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
      {
        name: 'Dekont paylaş',
        short_name: 'Dekont',
        url: '/admin-panel/dekont-paylas',
        icons: [{ src: icon, sizes: '192x192', type: 'image/png' }],
      },
    ],
    share_target: {
      action: '/api/admin/dekont/share-ingest',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
        files: [
          {
            name: 'dekont',
            accept: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'],
          },
        ],
      },
    },
  };
}

export function manifestForVariant(variant: PwaAppVariant): MetadataRoute.Manifest {
  return variant === 'admin' ? buildAdminManifest() : buildPersonnelManifest();
}
