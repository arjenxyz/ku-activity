import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { purgeDueAcceleratedEmployees } from '@/lib/employee-closure-purge';
import strings from '@json/src/app/api/cron/personnel-closure-purge/route.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
  }

  try {
    const result = await purgeDueAcceleratedEmployees();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.failed;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
