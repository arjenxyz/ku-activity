import { NextResponse } from 'next/server';
import { listEmployeeContracts } from '@/lib/contract-service';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { personnelApiErrorResponse } from '@/lib/safe-api-error';
import strings from '@json/src/app/api/personnel/contracts/route.json';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const contracts = await listEmployeeContracts(session.employeeId);
    return NextResponse.json({ contracts });
  } catch (err) {
    return personnelApiErrorResponse(err, strings.yüklenemedi);
  }
}
