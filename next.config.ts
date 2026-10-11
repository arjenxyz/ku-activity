import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'tesseract.js-core', 'sharp', 'mupdf'],
  outputFileTracingIncludes: {
    '/api/payments/claims': [
      './src/lib/payments/tessdata/**/*',
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/mupdf/dist/**/*',
    ],
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
    ];
  },
};

export default nextConfig;
