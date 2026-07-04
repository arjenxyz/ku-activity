import { NextResponse } from 'next/server';
import { listEmployeeContracts } from '@/lib/contract-service';
import { getPersonnelSession } from '@/lib/personnel-auth';
import strings from '@json/src/app/api/personnel/contracts/route.json';

export async function GET() {
  try {
    const session = await getPersonnelSession();
    if (!session) {
      return NextResponse.json({ error: strings.oturumGerekli }, { status: 401 });
    }

    const contracts = await listEmployeeContracts(session.employeeId);
    return NextResponse.json({ contracts });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.yüklenemedi;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
