import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPersonnelSession } from '@/lib/personnel-auth';
import { maybePurgeAcceleratedEmployee } from '@/lib/employee-closure-purge';
import { PERSONNEL_COOKIE, personnelCookieOptions } from '@/lib/personnel-session';
import strings from '@json/src/app/api/personnel/closure/execute-deletion/route.json';

/** Sayaç sıfırlandığında veya oturum yenilendiğinde hızlandırılmış silmeyi tetikler */
export async function POST() {
  try {
    const session = await getPersonnelSession();
    if (!session) {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }

    const purged = await maybePurgeAcceleratedEmployee(session.projectId, session.employeeId);

    if (purged) {
      const response = NextResponse.json({ purged: true });
      response.cookies.set(PERSONNEL_COOKIE, '', {
        ...personnelCookieOptions(new Date(0)),
        maxAge: 0,
      });
      const cookieStore = await cookies();
      cookieStore.set(PERSONNEL_COOKIE, '', {
        ...personnelCookieOptions(new Date(0)),
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ purged: false });
  } catch {
    return NextResponse.json({ error: strings.failed }, { status: 500 });
  }
}
