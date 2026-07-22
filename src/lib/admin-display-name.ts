import type { SupabaseClient } from '@supabase/supabase-js';

const FALLBACK = 'Yönetici';

/** profiles.full_name, yoksa e-posta, yoksa “Yönetici” */
export async function resolveAdminDisplayName(
  admin: SupabaseClient,
  userId: string,
  emailFallback?: string | null
): Promise<string> {
  const { data } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  const name = typeof data?.full_name === 'string' ? data.full_name.trim() : '';
  if (name) return name;

  const email = emailFallback?.trim();
  if (email) return email;

  return FALLBACK;
}
