import { requireDeveloperUser } from '@/lib/developer-auth';

export async function authorizeReleaseUpload(request: Request) {
  const secret = process.env.APK_UPLOAD_SECRET?.trim();
  const authHeader = request.headers.get('authorization');

  if (secret && authHeader === `Bearer ${secret}`) {
    return { userId: null as string | null, viaCi: true };
  }

  const user = await requireDeveloperUser();
  return { userId: user.id, viaCi: false };
}
