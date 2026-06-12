import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import { PERSONNEL_COOKIE, hashToken } from '@/lib/personnel-session';

export type PersonnelSession = {
  sessionId: string;
  employeeId: string;
  projectId: string;
  expiresAt: string;
};

export async function getPersonnelSession(): Promise<PersonnelSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PERSONNEL_COOKIE)?.value;
  if (!token) return null;

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

export async function requirePersonnelSession(): Promise<PersonnelSession> {
  const session = await getPersonnelSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
