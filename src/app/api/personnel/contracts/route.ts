import { NextResponse } from 'next/server';
import { listEmployeeContracts } from '@/lib/contract-service';
import { getPersonnelSession } from '@/lib/personnel-auth';

export async function GET() {
  try {
    const session = await getPersonnelSession();
    if (!session) {
      return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
    }

    const contracts = await listEmployeeContracts(session.employeeId);
    return NextResponse.json({ contracts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yüklenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
