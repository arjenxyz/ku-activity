import { requireDeveloperUser } from '@/lib/developer-auth';

function secretMatches(request: Request, secret: string): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  const encoded = request.headers.get('x-apk-upload-secret');
  const encoding = request.headers.get('x-apk-upload-secret-encoding');
  if (encoded && encoding === 'base64') {
    try {
      return Buffer.from(encoded, 'base64').toString('utf8') === secret;
    } catch {
      return false;
    }
  }

  return false;
}

export async function authorizeReleaseUpload(request: Request) {
  const secret = process.env.APK_UPLOAD_SECRET?.trim();

  if (secret && secretMatches(request, secret)) {
    return { userId: null as string | null, viaCi: true };
  }

  const user = await requireDeveloperUser();
  return { userId: user.id, viaCi: false };
}
