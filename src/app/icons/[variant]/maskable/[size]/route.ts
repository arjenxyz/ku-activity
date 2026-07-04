import { serveAppIcon } from '@/lib/serve-app-icon';
import type { AppIconVariant } from '@/lib/brand';

const ALLOWED = [192, 512] as const;

function parseVariant(value: string): AppIconVariant | null {
  if (value === 'personnel' || value === 'admin') return value;
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string; size: string }> }
) {
  const { variant: variantParam, size: sizeParam } = await params;
  const variant = parseVariant(variantParam);
  const size = parseInt(sizeParam, 10);

  if (!variant) {
    return new Response('Invalid variant', { status: 400 });
  }
  if (!ALLOWED.includes(size as (typeof ALLOWED)[number])) {
    return new Response('Invalid size', { status: 400 });
  }

  return serveAppIcon(variant, size, 'maskable');
}
