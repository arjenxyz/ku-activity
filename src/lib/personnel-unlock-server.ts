import 'server-only';
import { cookies } from 'next/headers';
import { PERSONNEL_UNLOCK_COOKIE } from '@/lib/personnel-cookie';
import {
  buildPersonnelUnlockCookieValue,
  getPersonnelUnlockExpiry,
  personnelUnlockCookieOptions,
  verifyPersonnelUnlockCookieValue,
} from '@/lib/personnel-unlock-cookie';

export async function setPersonnelUnlockCookie(sessionToken: string) {
  const cookieStore = await cookies();
  const expiresAt = await getPersonnelUnlockExpiry();
  const value = await buildPersonnelUnlockCookieValue(sessionToken, expiresAt);
  cookieStore.set(PERSONNEL_UNLOCK_COOKIE, value, personnelUnlockCookieOptions(expiresAt));
}

export async function clearPersonnelUnlockCookie() {
  const cookieStore = await cookies();
  cookieStore.set(PERSONNEL_UNLOCK_COOKIE, '', {
    ...personnelUnlockCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export async function slidePersonnelUnlockCookie(sessionToken: string) {
  await setPersonnelUnlockCookie(sessionToken);
}

export async function isPersonnelUnlocked(sessionToken: string | undefined): Promise<boolean> {
  if (!sessionToken) return false;
  const cookieStore = await cookies();
  const unlock = cookieStore.get(PERSONNEL_UNLOCK_COOKIE)?.value;
  return verifyPersonnelUnlockCookieValue(sessionToken, unlock);
}

export async function setPersonnelUnlockCookieOnResponse(
  response: { cookies: { set: (name: string, value: string, options: object) => void } },
  sessionToken: string
) {
  const expiresAt = await getPersonnelUnlockExpiry();
  const value = await buildPersonnelUnlockCookieValue(sessionToken, expiresAt);
  response.cookies.set(PERSONNEL_UNLOCK_COOKIE, value, personnelUnlockCookieOptions(expiresAt));
}

export async function clearPersonnelUnlockCookieOnResponse(
  response: { cookies: { set: (name: string, value: string, options: object) => void } }
) {
  response.cookies.set(PERSONNEL_UNLOCK_COOKIE, '', {
    ...personnelUnlockCookieOptions(new Date(0)),
    maxAge: 0,
  });
}
