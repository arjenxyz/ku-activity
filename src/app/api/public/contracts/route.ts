import { NextResponse } from 'next/server';
import { listActiveContracts } from '@/lib/contract-service';
import strings from '@json/src/app/api/public/contracts/route.json';

export async function GET() {
  try {
    const contracts = await listActiveContracts();
    return NextResponse.json({
      contracts: contracts
        .filter((c) => c.isRequired)
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          summary: c.summary,
          contentHtml: c.contentHtml,
          version: c.version,
        })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.sözleşmelerYüklenemedi;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
