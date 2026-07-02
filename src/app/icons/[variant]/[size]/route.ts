import { serveCrewledgerAppIcon } from '@/lib/serve-app-icon';

const ALLOWED = [192, 512] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string; size: string }> }
) {
  const { variant: variantParam, size: sizeParam } = await params;
  const size = parseInt(sizeParam, 10);

  if (variantParam !== 'personnel' && variantParam !== 'admin') {
    return new Response('Invalid variant', { status: 400 });
  }
  if (!ALLOWED.includes(size as (typeof ALLOWED)[number])) {
    return new Response('Invalid size', { status: 400 });
  }

  return serveCrewledgerAppIcon();
}
