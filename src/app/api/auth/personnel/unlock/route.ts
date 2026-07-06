import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  PersonnelUnlockRequiredError,
  requirePersonnelSession,
} from '@/lib/personnel-auth';
import { PERSONNEL_COOKIE } from '@/lib/personnel-cookie';
import { validatePersonnelPin } from '@/lib/personnel-pin';
import {
  isPersonnelUnlocked,
  setPersonnelUnlockCookieOnResponse,
} from '@/lib/personnel-unlock-server';
import strings from '@json/src/app/api/auth/personnel/unlock/route.json';

export async function GET() {
  try {
    const session = await requirePersonnelSession({ skipUnlockCheck: true });
    const admin = createAdminClient();
    const { data: employee } = await admin
      .from('employees')
      .select('name')
      .eq('id', session.employeeId)
      .maybeSingle();

    const cookieStore = await cookies();
    const token = cookieStore.get(PERSONNEL_COOKIE)?.value;
    const unlocked = await isPersonnelUnlocked(token);

    const fullName = employee?.name?.trim() ?? '';
    const firstName = fullName.split(/\s+/)[0] ?? fullName;

    return NextResponse.json({
      unlocked,
      firstName,
      fullName,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }
    return NextResponse.json({ error: strings.failed }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession({ skipUnlockCheck: true });
    const body = (await request.json()) as { pin?: string };
    const pin = body.pin?.trim() ?? '';
    const pinError = validatePersonnelPin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: employee } = await admin
      .from('employees')
      .select('pin_hash, is_active')
      .eq('id', session.employeeId)
      .maybeSingle();

    if (!employee?.is_active || !employee.pin_hash) {
      return NextResponse.json({ error: strings.invalidPin }, { status: 401 });
    }

    const valid = await bcrypt.compare(pin, employee.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: strings.invalidPin }, { status: 401 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(PERSONNEL_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    await setPersonnelUnlockCookieOnResponse(response, token);
    return response;
  } catch (err) {
    if (err instanceof PersonnelUnlockRequiredError) {
      return NextResponse.json({ error: strings.unlockRequired }, { status: 423 });
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }
    return NextResponse.json({ error: strings.failed }, { status: 500 });
  }
}
