import { buildAssetLinksJson } from '@/lib/twa-asset-links';

export async function GET() {
  const links = buildAssetLinksJson();

  return Response.json(links, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
