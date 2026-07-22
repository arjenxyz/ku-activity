import { NextResponse } from 'next/server';
import { fetchWebUpdates } from '@/lib/web-updates';
import strings from '@json/src/lib/web-updates.json';

export async function GET() {
  try {
    const { updates, source } = await fetchWebUpdates(30);
    return NextResponse.json({
      updates,
      latestAt: updates[0]?.date ?? null,
      source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.sistemHatası;
    return NextResponse.json({ error: message, updates: [] }, { status: 502 });
  }
}
