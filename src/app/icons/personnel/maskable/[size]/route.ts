import { renderPwaMaskableIcon } from '@/lib/pwaIcon';

const ALLOWED = [192, 512] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = parseInt(sizeParam, 10);

  if (!ALLOWED.includes(size as (typeof ALLOWED)[number])) {
    return new Response('Invalid size', { status: 400 });
  }

  const response = renderPwaMaskableIcon(size);
  response.headers.set('Cache-Control', 'public, max-age=86400, immutable');
  response.headers.set('Content-Type', 'image/png');
  return response;
}
