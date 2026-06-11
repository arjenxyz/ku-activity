import { createClient } from '@/utils/supabase/server';

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
  if (rpcError || !isAdmin) return null;

  return user;
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}
