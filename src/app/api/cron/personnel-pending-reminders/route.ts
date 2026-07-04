import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import strings from '@json/src/app/api/cron/personnel-pending-reminders/route.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: strings.yetkisiz }, { status: 401 });
  }

  return NextResponse.json({
    disabled: true,
    reason: 'Çift onay kaldırıldı; personel onay hatırlatması artık gönderilmiyor.',
    sent: 0,
  });
}
