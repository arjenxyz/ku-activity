/** Vercel Cron, cron-job.org ve benzeri harici ping servisleri */
export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  const vercelHeader = request.headers.get('x-vercel-cron-secret');
  if (vercelHeader && vercelHeader === secret) return true;

  // cron-job.org: isteğe bağlı ?secret= (URL'yi kimseyle paylaşmayın)
  try {
    const q = new URL(request.url).searchParams.get('secret');
    if (q && q === secret) return true;
  } catch {
    // ignore
  }

  return false;
}
