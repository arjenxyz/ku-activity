/** Vercel Cron ve harici ping servisleri için ortak yetkilendirme */
export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  // Vercel Cron bazen CRON_SECRET'i header olarak iletir
  const vercelHeader = request.headers.get('x-vercel-cron-secret');
  if (vercelHeader && vercelHeader === secret) return true;

  return false;
}
