import { iconHeadResponse, serveAppIcon } from '@/lib/serve-app-icon';
import type { AppIconVariant } from '@/lib/brand';

const ALLOWED = [192, 512] as const;

function parseVariant(value: string): AppIconVariant | null {
  if (value === 'personnel' || value === 'admin') return value;
  return null;
}

function parseIconParams(variantParam: string, sizeParam: string) {
  const variant = parseVariant(variantParam);
  const size = parseInt(sizeParam, 10);
  if (!variant) return { error: new Response('Invalid variant', { status: 400 }) };
  if (!ALLOWED.includes(size as (typeof ALLOWED)[number])) {
    return { error: new Response('Invalid size', { status: 400 }) };
  }
  return { variant, size };
}

export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ variant: string; size: string }> }
) {
  const { variant: variantParam, size: sizeParam } = await params;
  const parsed = parseIconParams(variantParam, sizeParam);
  if ('error' in parsed) return parsed.error;
  return iconHeadResponse();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string; size: string }> }
) {
  const { variant: variantParam, size: sizeParam } = await params;
  const parsed = parseIconParams(variantParam, sizeParam);
  if ('error' in parsed) return parsed.error;
  return serveAppIcon(parsed.variant, parsed.size, 'maskable');
}
