import { NextRequest, NextResponse } from 'next/server';
import strings from '@json/src/app/api/public/support-chat/route.json';
import { parseLocale } from '@/lib/i18n/locale';
import { checkSupportChatRateLimit } from '@/lib/support-chat-rate-limit';
import { generateSupportChatReply, isSupportChatConfigured, type SupportChatMessage } from '@/lib/support-chat';

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

export async function POST(req: NextRequest) {
  try {
    if (!isSupportChatConfigured()) {
      return NextResponse.json({ error: strings.aiYapılandırılmamış }, { status: 503 });
    }

    const ip = clientIp(req);
    const allowed = await checkSupportChatRateLimit(`support-chat:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: strings.rateLimit }, { status: 429 });
    }

    const body = (await req.json()) as { messages?: unknown; locale?: unknown };
    const messages = sanitizeMessages(body.messages);
    if (!messages) {
      return NextResponse.json({ error: strings.geçersizMesaj }, { status: 400 });
    }

    const last = messages[messages.length - 1];
    if (last.role !== 'user') {
      return NextResponse.json({ error: strings.geçersizMesaj }, { status: 400 });
    }
    if (last.content.length > MAX_MESSAGE) {
      return NextResponse.json({ error: strings.mesajÇokUzun }, { status: 413 });
    }

    const locale = parseLocale(typeof body.locale === 'string' ? body.locale : null);
    const reply = await generateSupportChatReply(messages, locale);

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'SUPPORT_CHAT_NOT_CONFIGURED') {
      return NextResponse.json({ error: strings.aiYapılandırılmamış }, { status: 503 });
    }
    return NextResponse.json({ error: strings.yanıtAlınamadı }, { status: 500 });
  }
}
