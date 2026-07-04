import { NextRequest, NextResponse } from 'next/server';
import { sendScreenReport } from '@/lib/screen-report';
import strings from '@json/src/app/api/public/screen-report/route.json';

export const dynamic = 'force-dynamic';

const MAX_SCREENSHOT_CHARS = 4_000_000;
const MAX_NOTE = 500;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      screenshot?: string;
      pageUrl?: string;
      userAgent?: string;
      capturedAt?: string;
      formError?: string;
      diagnostics?: string[];
      note?: string;
      screenLabel?: string;
    };

    const screenshot = typeof body.screenshot === 'string' ? body.screenshot : '';
    if (!screenshot.startsWith('data:image/')) {
      return NextResponse.json({ error: strings.geçersizEkranGörüntüsü }, { status: 400 });
    }
    if (screenshot.length > MAX_SCREENSHOT_CHARS) {
      return NextResponse.json({ error: strings.ekranGörüntüsüÇokBüyük }, { status: 413 });
    }

    const note = typeof body.note === 'string' ? body.note.trim().slice(0, MAX_NOTE) : undefined;
    const diagnostics = Array.isArray(body.diagnostics)
      ? body.diagnostics.filter((d): d is string => typeof d === 'string').slice(0, 10)
      : [];

    await sendScreenReport({
      screenshotBase64: screenshot,
      pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : '',
      userAgent: typeof body.userAgent === 'string' ? body.userAgent.slice(0, 500) : '',
      capturedAt: typeof body.capturedAt === 'string' ? body.capturedAt : new Date().toISOString(),
      formError: typeof body.formError === 'string' ? body.formError.slice(0, 500) : undefined,
      diagnostics,
      note,
      screenLabel: typeof body.screenLabel === 'string' ? body.screenLabel.slice(0, 80) : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.raporGönderilemedi;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
