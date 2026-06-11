import { renderPwaIcon } from '@/lib/pwaIcon';

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

  return renderPwaIcon(size);
}
