import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'mupdf'],
  async rewrites() {
    return [
      { source: '/personnel-panel/demo', destination: '/personnel-panel' },
      { source: '/personnel-panel/demo/avans', destination: '/personnel-panel/avans' },
      { source: '/personnel-panel/demo/avans-onay', destination: '/personnel-panel/avans-onay' },
      { source: '/personnel-panel/demo/yoklama', destination: '/personnel-panel/yoklama' },
      { source: '/admin-panel/demo', destination: '/admin-panel' },
      {
        source: '/admin-panel/demo/proje/:path*',
        destination: '/admin-panel/proje/:path*',
      },
      {
        source: '/admin-panel/demo/basvuru-onay',
        destination: '/admin-panel/basvuru-onay',
      },
      {
        source: '/admin-panel/demo/maas-politikasi',
        destination: '/admin-panel/maas-politikasi',
      },
      {
        source: '/admin-panel/demo/ayarlar',
        destination: '/admin-panel/ayarlar',
      },
      {
        source: '/admin-panel/demo/arjen/:path*',
        destination: '/admin-panel/arjen/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=300' },
        ],
      },
      {
        source: '/manifest-personnel.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
        ],
      },
      {
        source: '/manifest-admin.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
