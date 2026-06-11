import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import { PERSONNEL_COOKIE, hashToken, personnelCookieOptions } from '@/lib/personnel-session';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PERSONNEL_COOKIE)?.value;

  if (token) {
    try {
      const admin = createAdminClient();
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
