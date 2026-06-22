import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  return NextResponse.json({
    disabled: true,
    reason: 'Çift onay kaldırıldı; personel onay hatırlatması artık gönderilmiyor.',
    sent: 0,
  });
}
