import { NextRequest, NextResponse } from 'next/server';
import strings from '@json/src/app/api/public/support-chat/route.json';
import { parseLocale } from '@/lib/i18n/locale';
import { checkSupportChatRateLimit } from '@/lib/support-chat-rate-limit';
import {
  generateSupportChatReply,
  isSupportChatConfigured,
  SupportChatError,
  type SupportChatMessage,
} from '@/lib/support-chat';
import {
  handleSupportBugReport,
  isBugReportMessage,
} from '@/lib/support-bug-report';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE = 1200;
const MAX_HISTORY = 12;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'anonymous'
  );
}

function sanitizeMessages(raw: unknown): SupportChatMessage[] | null {
  if (!Array.isArray(raw)) return null;

  const messages: SupportChatMessage[] = [];
  for (const item of raw.slice(-MAX_HISTORY)) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    messages.push({ role, content: trimmed.slice(0, MAX_MESSAGE) });
  }

  return messages.length ? messages : null;
}

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(req: NextRequest) {
  try {
    if (!isSupportChatConfigured()) {
      return errorResponse(strings.aiYapılandırılmamış, 'NOT_CONFIGURED', 503);
    }

    const ip = clientIp(req);
    const allowed = await checkSupportChatRateLimit(`support-chat:${ip}`);
    if (!allowed) {
      return errorResponse(strings.rateLimit, 'RATE_LIMIT', 429);
    }

    let body: {
      messages?: unknown;
      locale?: unknown;
      screenshot?: unknown;
      browserErrors?: unknown;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return errorResponse(strings.geçersizMesaj, 'INVALID', 400);
    }

    const messages = sanitizeMessages(body.messages);
    if (!messages) {
      return errorResponse(strings.geçersizMesaj, 'INVALID', 400);
    }

    const last = messages[messages.length - 1];
    if (last.role !== 'user') {
      return errorResponse(strings.geçersizMesaj, 'INVALID', 400);
    }
    if (last.content.length > MAX_MESSAGE) {
      return errorResponse(strings.mesajÇokUzun, 'TOO_LONG', 413);
    }

    const locale = parseLocale(typeof body.locale === 'string' ? body.locale : null);

    const screenshot =
      typeof body.screenshot === 'string' && body.screenshot.startsWith('data:image/')
        ? body.screenshot.slice(0, 2_500_000)
        : undefined;
    const browserErrors = Array.isArray(body.browserErrors)
      ? body.browserErrors
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim().slice(0, 280))
          .filter(Boolean)
          .slice(0, 12)
      : [];

    if (isBugReportMessage(last.content)) {
      const result = await handleSupportBugReport(messages, locale, {
        screenshotBase64: screenshot,
        browserErrors,
      });
      return NextResponse.json({
        reply: result.reply,
        suggestedFollowUps: [],
        ticket: result.ticket,
      });
    }

    const result = await generateSupportChatReply(messages, locale);

    return NextResponse.json({
      reply: result.reply,
      suggestedFollowUps: [],
    });
  } catch (err) {
    if (err instanceof SupportChatError) {
      switch (err.code) {
        case 'NOT_CONFIGURED':
          return errorResponse(strings.aiYapılandırılmamış, 'NOT_CONFIGURED', 503);
        case 'AUTH':
          return errorResponse(strings.aiYapılandırılmamış, 'AUTH', 503);
        case 'QUOTA':
          return errorResponse(strings.kotaAşıldı, 'QUOTA', 429);
        case 'MODEL':
        case 'UNAVAILABLE':
          return errorResponse(strings.geçiciOlarakKullanılamıyor, err.code, 503);
        case 'EMPTY':
        case 'UPSTREAM':
        default:
          return errorResponse(strings.yanıtAlınamadı, err.code, 502);
      }
    }

    const message = err instanceof Error ? err.message : '';
    if (message === 'SUPPORT_CHAT_NOT_CONFIGURED') {
      return errorResponse(strings.aiYapılandırılmamış, 'NOT_CONFIGURED', 503);
    }
    return errorResponse(strings.yanıtAlınamadı, 'UPSTREAM', 502);
  }
}
