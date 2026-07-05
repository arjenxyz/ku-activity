import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import { getPersonnelSession } from '@/lib/personnel-auth';
import { removePushSubscriptionsForSession } from '@/lib/personnel-push-service';
import { PERSONNEL_COOKIE, hashToken, personnelCookieOptions } from '@/lib/personnel-session';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PERSONNEL_COOKIE)?.value;
  const session = token ? await getPersonnelSession() : null;

  if (token) {
    try {
      const admin = createAdminClient();
      if (session?.sessionId) {
        await removePushSubscriptionsForSession(admin, session.sessionId);
      }
      const tokenHash = hashToken(token);
      const { error: rpcError } = await admin.rpc('revoke_personnel_session', {
        p_token_hash: tokenHash,
      });
      if (rpcError) {
        await admin
          .from('personnel_sessions')
          .update({ revoked_at: new Date().toISOString() })
          .eq('token_hash', tokenHash);
      }
    } catch (e) {
      console.error('Oturum iptal hatası:', e);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(PERSONNEL_COOKIE, '', { ...personnelCookieOptions(new Date(0)), maxAge: 0 });
  return response;
}
