import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  PERSONNEL_COOKIE,
  getSessionExpiry,
  hashToken,
  personnelCookieOptions,
} from '@/lib/personnel-session';

export type PersonnelSession = {
  sessionId: string;
  employeeId: string;
  projectId: string;
  expiresAt: string;
};

const SLIDE_REFRESH_WITHIN_MS = 30 * 24 * 60 * 60 * 1000;

async function loadSessionFromToken(token: string): Promise<PersonnelSession | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('validate_personnel_session', {
    p_token_hash: hashToken(token),
  });

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  if (error || rows.length === 0) return null;

  const row = rows[0] as {
    session_id: string;
    employee_id: string;
    project_id: string;
    expires_at: string;
  };

  return {
    sessionId: row.session_id,
    employeeId: row.employee_id,
    projectId: row.project_id,
    expiresAt: row.expires_at,
  };
}

async function slidePersonnelSession(sessionId: string, token: string) {
  const expiresAt = getSessionExpiry();
  const admin = createAdminClient();
  await admin
    .from('personnel_sessions')
    .update({ expires_at: expiresAt.toISOString() })
    .eq('id', sessionId)
    .is('revoked_at', null);

  const cookieStore = await cookies();
  cookieStore.set(PERSONNEL_COOKIE, token, personnelCookieOptions(expiresAt));
}

export async function getPersonnelSession(): Promise<PersonnelSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PERSONNEL_COOKIE)?.value;
  if (!token) return null;
  return loadSessionFromToken(token);
}

export async function requirePersonnelSession(options?: {
  skipUnlockCheck?: boolean;
}): Promise<PersonnelSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PERSONNEL_COOKIE)?.value;
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const session = await loadSessionFromToken(token);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  const { maybePurgeAcceleratedEmployee } = await import('@/lib/employee-closure-purge');
  const purged = await maybePurgeAcceleratedEmployee(session.projectId, session.employeeId);
  if (purged) {
    throw new Error('UNAUTHORIZED');
  }

  const { maybePurgeProjectIfDeadlinePassed } = await import('@/lib/project-closure-purge');
  const projectPurged = await maybePurgeProjectIfDeadlinePassed(session.projectId);
  if (projectPurged) {
    throw new Error('UNAUTHORIZED');
  }

  const msLeft = new Date(session.expiresAt).getTime() - Date.now();
  if (msLeft < SLIDE_REFRESH_WITHIN_MS) {
    await slidePersonnelSession(session.sessionId, token);
    session.expiresAt = getSessionExpiry().toISOString();
  }

  if (!options?.skipUnlockCheck) {
    const { isPersonnelUnlocked, slidePersonnelUnlockCookie } = await import(
      '@/lib/personnel-unlock-server'
    );
    const unlocked = await isPersonnelUnlocked(token);
    if (!unlocked) {
      throw new PersonnelUnlockRequiredError();
    }
    await slidePersonnelUnlockCookie(token);
  }

  return session;
}

export class PersonnelUnlockRequiredError extends Error {
  constructor() {
    super('UNLOCK_REQUIRED');
    this.name = 'PersonnelUnlockRequiredError';
  }
}

export class PersonnelClosureWriteBlockedError extends Error {
  constructor() {
    super('PROJECT_IN_CLOSURE');
    this.name = 'PersonnelClosureWriteBlockedError';
  }
}

/** Kapanış sürecinde operasyonel yazma işlemleri için — indirme/onay hariç */
export async function requirePersonnelWritableSession(): Promise<PersonnelSession> {
  const session = await requirePersonnelSession();
  const { assertPersonnelProjectWritable, ProjectClosureWriteBlockedError } = await import(
    '@/lib/project-closure-guard'
  );
  try {
    await assertPersonnelProjectWritable(session.projectId);
  } catch (err) {
    if (err instanceof ProjectClosureWriteBlockedError) {
      throw new PersonnelClosureWriteBlockedError();
    }
    throw err;
  }
  return session;
}
