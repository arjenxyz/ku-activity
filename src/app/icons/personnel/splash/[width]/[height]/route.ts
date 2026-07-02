import { renderPwaSplashScreen } from '@/lib/pwaIcon';

const MAX = 2048;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ width: string; height: string }> }
) {
  const { width: wParam, height: hParam } = await params;
  const width = parseInt(wParam, 10);
  const height = parseInt(hParam, 10);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 320 ||
    height < 320 ||
    width > MAX ||
    height > MAX
  ) {
    return new Response('Invalid dimensions', { status: 400 });
  }

  const response = renderPwaSplashScreen(width, height);
  response.headers.set('Cache-Control', 'public, max-age=86400, immutable');
  response.headers.set('Content-Type', 'image/png');
  return response;
}
