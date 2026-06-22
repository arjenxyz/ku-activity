import { manifestForVariant } from '@/lib/pwa-manifest';

export async function GET() {
  const manifest = manifestForVariant('personnel');
  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
