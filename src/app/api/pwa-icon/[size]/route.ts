import { serveAppIcon } from '@/lib/serve-app-icon';
import type { AppIconVariant } from '@/lib/brand';

const ALLOWED = [192, 512] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = parseInt(sizeParam, 10);
  const variantParam = new URL(request.url).searchParams.get('variant');
  const variant: AppIconVariant =
    variantParam === 'admin' || variantParam === 'staff'
      ? 'admin'
      : variantParam === 'student'
        ? 'student'
        : 'personnel';

  if (!ALLOWED.includes(size as (typeof ALLOWED)[number])) {
    return new Response('Invalid size', { status: 400 });
  }

  return serveAppIcon(variant, size, 'any');
}
