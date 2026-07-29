import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let supportChatRatelimit: Ratelimit | null | undefined;

function getSupportChatRatelimit(): Ratelimit | null {
  if (supportChatRatelimit !== undefined) return supportChatRatelimit;

  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;
  if (!url || !token) {
    supportChatRatelimit = null;
    return null;
  }

  supportChatRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(20, '3600 s'),
    analytics: true,
    prefix: 'support-chat',
  });

  return supportChatRatelimit;
}

export async function checkSupportChatRateLimit(key: string): Promise<boolean> {
  const limiter = getSupportChatRatelimit();
  if (!limiter) return true;

  const { success } = await limiter.limit(key);
  return success;
}
