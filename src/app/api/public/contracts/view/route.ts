import { NextResponse } from 'next/server';
import { getContractByAccessToken } from '@/lib/contract-service';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  const slug = url.searchParams.get('slug');

  if (!token || !slug) {
    return NextResponse.json({ error: 'Geçersiz bağlantı' }, { status: 400 });
  }

  const contract = await getContractByAccessToken(token);
  if (!contract || contract.slug !== slug) {
    return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({
    title: contract.title,
    contentHtml: contract.contentHtml,
    version: contract.version,
    acceptedAt: contract.acceptedAt,
    fullName: contract.fullName,
    email: contract.email,
  });
}
