import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ArjenDev — İnşaat Personel Yönetimi',
    short_name: 'ArjenDev',
    description:
      'Yevmiye, avans, proje takibi ve maaş hesaplamaları için modern HR yönetim platformu.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    lang: 'tr',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/api/pwa-icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Yönetici Girişi',
        short_name: 'Yönetici',
        url: '/admin-panel/login',
        icons: [{ src: '/api/pwa-icon/192', sizes: '192x192' }],
      },
      {
        name: 'Personel Girişi',
        short_name: 'Personel',
        url: '/personnel-panel/login',
        icons: [{ src: '/api/pwa-icon/192', sizes: '192x192' }],
      },
    ],
  };
}
