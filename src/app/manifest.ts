import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CrewLedger — Construction Workforce',
    short_name: 'CrewLedger',
    description:
      'Construction crew management: attendance, wages, contracts, and payroll.',
    start_url: '/personnel-panel',
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
