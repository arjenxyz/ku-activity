import type { MetadataRoute } from 'next';
import { APP_NAME, APP_SHORT_NAME, APP_ICON } from '@/lib/brand';
import { PWA_ASSET_VERSION } from '@/lib/pwa-manifest';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: 'Kastamonu Üniversitesi Turizm Fakültesi Öğrenci Etkinlik Yönetimi',
    start_url: '/',
    display: 'standalone',
    background_color: '#0E1548',
    theme_color: '#0E1548',
    icons: [
      {
        src: `${APP_ICON}?v=${PWA_ASSET_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
