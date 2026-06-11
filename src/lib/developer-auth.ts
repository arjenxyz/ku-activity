import { createClient } from '@/utils/supabase/server';

export async function getDeveloperUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: isDeveloper, error: rpcError } = await supabase.rpc('is_developer');
  if (rpcError || !isDeveloper) return null;

  return user;
}

export async function requireDeveloperUser() {
  const user = await getDeveloperUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}
